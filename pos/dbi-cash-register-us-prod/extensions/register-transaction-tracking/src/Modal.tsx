import { useEffect, useState } from "react";
import {
  Text,
  Button,
  Screen,
  Navigator,
  Stack,
  useApi,
  reactExtension,
  Selectable,
  ScrollView,
  Box,
  Icon
} from "@shopify/ui-extensions-react/point-of-sale";
import type {
  cashTrackingSessionsType,
  fetchOptionsType,
  startStopTrackingType,
} from "./Types";

const Modal = () => {
  const api = useApi<"pos.home.tile.render">(),
    [trackingSessions, setTrackingSessions] =
      useState<cashTrackingSessionsType>([]),
    baseURL = process.env.REACT_APP_MIDDLEWARE_URL || "https://sit.dev-shopify.middleware.davidsbridal.com",
    [deviceId, setdeviceId] = useState(""),
    { currentSession } = useApi<"pos.home.modal.render">().session,
    { locationId, staffMemberId, currency } = currentSession,
    countryCode =
      currency === "USD" || currency === "CAD"
        ? { USD: "US", CAD: "CA" }[currency]
        : "US",
    [loading, setLoading] = useState(true),
    [syncMode, setSyncMode] = useState(""),
    [disabled, setDisabled] = useState(false),
    [selectedRegisters, setSelectedRegisters] = useState<Set<string>>(new Set()),
    [selectedSessions, setSelectedSessions] = useState<cashTrackingSessionsType>([]),
    [registers, setRegisters] = useState<string[]>([]),
    [businessDate, setBusinessDate] = useState<string>(""),
    [syncedOpeningRegisters, setSyncedOpeningRegisters] = useState<Set<string>>(new Set());

  // Calculate business date from current session
  useEffect(() => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    setBusinessDate(dateString);
  }, []);

  useEffect(() => {
    const uniqueRegisters = [...new Set(trackingSessions.map(session => session.node.registerName))];
    setRegisters(uniqueRegisters);
  }, [trackingSessions]);

  const fetchOptions: fetchOptionsType = (token: string) => {
      return {
        method: "GET",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true"
        },
      };
    };

  
  function getRegisterStatus(registerName: string, session: any) {
    if (syncMode === "opening" && syncedOpeningRegisters.has(registerName)) {
      return "CLOSING";
    }
    return session && !session.node.closingTime ? "OPEN" : "CLOSED";
  }
  
  const synchronizeTracking = async () => {
    if (selectedSessions.length === 0) {
      api.toast.show("Please select at least one register");
      return;
    }

    // Prevent mixed selection: all selected must have the same status
    const selectedStatuses = selectedSessions.map(session => getRegisterStatus(session.node.registerName, session));
    const uniqueStatuses = Array.from(new Set(selectedStatuses));
    if (uniqueStatuses.length > 1) {
      api.toast.show("Cannot sync registers with mixed status. Please select only registers with the same status.");
      return;
    }

    if (syncMode === "closing" && registers.length !== selectedRegisters.size) {
      api.toast.show("You need to select all closed registers to sync in closing mode.");
      return;
    }

    api.session.getSessionToken().then((token) => {
      if (!token) return;
      setLoading(true);
      setDisabled(true);

      // Process each selected register sequentially
      const processRegisters = async () => {
        let successCount = 0;
        let errorCount = 0;
        let syncedNames: string[] = [];

        for (const session of selectedSessions) {
          try {
            const sessionId = session.node.id.split("/").pop();
            const openingTime = session.node.openingTime;
            const closingTime = session.node.closingTime;
            const registerName = session.node.registerName;

            const response = await fetch(
              `${baseURL}/cash/getSession?locationId=${locationId}&locale=${countryCode}&staffId=${staffMemberId}&type=${syncMode}&sessionId=${sessionId}&deviceId=${deviceId}&sessionStartDate=${openingTime}${syncMode === "closing" ? `&sessionEndDate=${closingTime}` : ""}`,
              fetchOptions(token),
            );

            const data: startStopTrackingType = await response.json();
            
            if (data?.success) {
              successCount++;
              if (syncMode === "opening") {
                syncedNames.push(registerName);
              }
            } else {
              errorCount++;
              console.error(`Error syncing register ${registerName}:`, data?.error);
            }
          } catch (error) {
            errorCount++;
            console.error("Error processing register:", error);
          }
        }

        if(syncMode === 'closing') {
          try {
            await fetch(
              `${baseURL}/cash/sendStoreCloseInfo?locationId=${locationId}&locale=${countryCode}&sessionStartDate=${businessDate}T00:00:00z&sessionEndDate=${businessDate}T23:59:59z`,
              fetchOptions(token),
            );
          } catch (error) {
            console.error("Error syncing store close info:", error);
          }
        }

        // After successful opening sync, update local state
        if (syncMode === "opening" && successCount > 0) {
          setSyncedOpeningRegisters(prev => new Set([...Array.from(prev), ...syncedNames]));
        }

        // Show summary toast
        if (successCount > 0 && errorCount === 0) {
          api.toast.show(`Successfully ${syncMode === "closing" ? "stopped" : "started"} tracking for ${successCount} register(s)`);
        } else if (successCount > 0 && errorCount > 0) {
          api.toast.show(`Partially completed: ${successCount} success, ${errorCount} failed`);
        } else {
          api.toast.show(`Failed to sync ${errorCount} register(s)`);
        }

        setLoading(false);
        setDisabled(false);
      };

      processRegisters();
    });
  };

  const handleError = (errorMessage: string) => {
    setDisabled(true);
    api.toast.show(`Error: ${errorMessage}`);
  };

  const handleData = async (response: any) => {
    try {
      const data = await response.json();
      setLoading(false);
      setDisabled(false);
      if (data?.error) throw new Error(data.error);
      else {
        if (data.data.length === 0)
          throw new Error("Please, end/start a session!");

        setTrackingSessions(data.data);
        setSyncMode(!data.data[0].node.closingTime ? "opening" : "closing");
      }
    } catch (error) {
      handleError((error as Error).message);
    }
  };

  // Only allow selection of registers with the same status as the first selected
  const onRegisterToggle = (registerName: string, isSelected: boolean) => {
    const session = trackingSessions.find(s => s.node.registerName === registerName);
    const status = getRegisterStatus(registerName, session);
    const newSelectedRegisters = new Set(selectedRegisters);
    const selectedStatuses = Array.from(newSelectedRegisters).map(name => {
      const s = trackingSessions.find(sess => sess.node.registerName === name);
      return getRegisterStatus(name, s);
    });
    if (isSelected) {
      // If already have a selection, only allow if status matches
      if (selectedStatuses.length > 0 && selectedStatuses[0] !== status) {
        api.toast.show("Cannot select registers with different status. Please select only registers with the same status.");
        return;
      }
      newSelectedRegisters.add(registerName);
    } else {
      newSelectedRegisters.delete(registerName);
    }
    setSelectedRegisters(newSelectedRegisters);
    // Update selected sessions based on selected registers
    const newSelectedSessions = trackingSessions.filter(session => 
      newSelectedRegisters.has(session.node.registerName)
    );
    setSelectedSessions(newSelectedSessions);
    // Update sync mode based on first selected session
    if (newSelectedSessions.length > 0) {
      const firstSession = newSelectedSessions[0];
      setSyncMode(!firstSession.node.closingTime ? "opening" : "closing");
    }
    setDisabled(newSelectedSessions.length === 0);
  };

  const onLoadingAPICall = async () => {
    api.session.getSessionToken().then((token) => {
      if (!token) return;
      api.device.getDeviceId().then((deviceId) => {
        setdeviceId(deviceId);
        fetch(`${baseURL}/cash/getSessions?locationId=${api.session.currentSession.locationId}&locale=${countryCode}&deviceId=${deviceId}`, fetchOptions(token)).then(handleData).catch(handleError);
      }); 
    });
  }

  useEffect(() => {
    onLoadingAPICall();
  }, []);

  return (
    <Navigator>
      <Screen name="main" title="Transaction tracking">
        <ScrollView>
          <Stack
            direction="vertical"
            spacing={2}
            paddingHorizontal={"ExtraLarge"}
            paddingVertical={"ExtraLarge"}
          >
            {/* Business Date Display */}
            <Box padding="400">
              <Text>Business Date: {businessDate}</Text>
            </Box>

            {
              selectedSessions.length === 0 && (
                <Text>
                  Please select one or more registers to capture session details
                </Text>
              )
            }
            {
              !loading && trackingSessions.length === 0 && (
                <Text>There are no sessions available</Text>
              )
            }
            {
              trackingSessions.length > 0 && (
                <>
                  <Text>Select Registers:</Text>
                  <Stack direction="vertical" spacing={1}>
                    {registers.map((registerName, index) => {
                      // Find the session for this register to get its status
                      const session = trackingSessions.find(s => s.node.registerName === registerName);
                      const status = getRegisterStatus(registerName, session);
                      return (
                        <Box key={registerName}>
                          <Selectable
                            onPress={() => onRegisterToggle(registerName, !selectedRegisters.has(registerName))}
                            // Optionally, you could disable selection if status doesn't match current selection
                            // isDisabled={selectedRegisters.size > 0 && !selectedRegisters.has(registerName) && getRegisterStatus(registerName, session) !== Array.from(selectedRegisters).map(name => getRegisterStatus(name, trackingSessions.find(s => s.node.registerName === name)))[0]}
                          >
                            <Box padding="500">
                              <Stack direction="horizontal" alignContent="stretch" justifyContent="space-between">
                                {selectedRegisters.has(registerName) ? (
                                  <Text variant="headingSmall" color="TextInteractive">
                                    <Icon name="checkmark" size="major" />
                                  </Text>
                                ) : <Text variant="headingSmall" color="TextNeutral">
                                    <Icon name="plus" size="major" />
                                  </Text>}
                                <Text 
                                  variant={selectedRegisters.has(registerName) ? "headingSmall" : "body"}
                                  color={selectedRegisters.has(registerName) ? "TextInteractive" : "TextNeutral"}
                                >
                                  {registerName} {'('}{status}{')'}
                                </Text>
                              </Stack>
                            </Box>
                          </Selectable>
                        </Box>
                      );
                    })}
                  </Stack>
                  
                  {
                    selectedSessions.length > 0 && (
                      <Box padding="400">
                        <Stack direction="vertical" spacing={2}>
                          <Text>
                            Selected Registers: {Array.from(selectedRegisters).join(", ")}
                          </Text>
                          <Text>
                            Total Sessions: {selectedSessions.length}
                          </Text>
                        </Stack>
                      </Box>
                    )
                  }
                </>
              )
            }
            <Text>
              Sync your data only at the start and end of your session. Don't sync in the middle of the day
            </Text>
            <Button
              title={`Synchronize ${selectedRegisters.size > 0 ? selectedRegisters.size : ''} Register${selectedRegisters.size !== 1 ? 's' : ''}`}
              onPress={synchronizeTracking}
              isLoading={loading}
              isDisabled={disabled || selectedSessions.length === 0}
            />
            
            {/* Debug Information */}
            <Box padding="400">
              <Text>Base URL: {baseURL}</Text>
              <Text>Staff member ID: {staffMemberId}</Text>
              <Text>Location ID: {locationId}</Text>
              <Text>Sync Mode: {syncMode}</Text>
              <Text>Selected Count: {selectedSessions.length}</Text>
            </Box>
          </Stack>
        </ScrollView>
      </Screen>
    </Navigator>
  );
};

export default reactExtension("pos.home.modal.render", () => <Modal />);
