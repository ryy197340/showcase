export type cashTrackingSessionsType = {
  node: {
    id: string;
    registerName: string;
    openingTime: string;
    closingTime: string | null;
    openingStaffMember: {
      firstName: string;
      lastName: string;
      email: string;
      id: string;
    };
    closingStaffMember: {
      firstName: string;
      lastName: string;
      email: string;
      id: string;
    };
    location: {
      id: string;
      name: string;
      storeId: { value: string };
    };
  };
}[];

export type startStopTrackingType = {
  success: boolean;
  data?: { isSyncWithTransactionHub: boolean };
  error?: string;
};

export type fetchOptionsType = (token: string) => {
  method: "GET" | "POST" | "PUT" | "DELETE";
  mode: "cors" | "no-cors" | "same-origin";
  credentials: "include" | "same-origin" | "omit";
  headers: {
    "Content-Type": string;
    Authorization: string;
  };
};
