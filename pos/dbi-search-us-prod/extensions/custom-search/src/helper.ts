export const sortOptions: string[] = ["Title (A-Z)", "Title (Z-A)"];

export const handleCurrency = (curr: string) => {
  if (curr === "USD") {
    return "$";
  } else if (curr === "EUR") {
    return "€";
  } else if (curr === "GBP") {
    return "£";
  } else if (curr === "AUD") {
    return "A$";
  } else if (curr === "CAD") {
    return "CA$";
  } else if (curr === "JPY") {
    return "¥";
  } else if (curr === "NZD") {
    return "NZ$";
  } else if (curr === "SGD") {
    return "S$";
  } else if (curr === "HKD") {
    return "HK$";
  } else if (curr === "SEK") {
    return "kr";
  } else if (curr === "DKK") {
    return "kr";
  } else if (curr === "PLN") {
    return "zł";
  } else if (curr === "CHF") {
    return "CHF";
  } else {
    return curr;
  }
};

export interface IData {
  displayLoyaltyPrice: any;
  displayDiscountedLoyaltyPrice: any;
  id: string;
  title: string;
  imageSrc: string;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    memberPrice?: number;
    quantity?: number;
  }>;
  variantsCount?: number;
  masterStyle: string;
  minPrice: number;
  maxPrice: number;
  combinedTitle?: string;
  displayPrice?: string;
  totalQuantity?: number;
  minMemberPrice?: number;
  maxMemberPrice?: number;
}

export const toSentenceCase = (str: string) => {
  if (!str) return str;
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const convertDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const convertToUnixTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  const unixTimestamp = date.getTime();
  return unixTimestamp;
};

export const queryToMiddleWare = async (locationId: string, locale: string) => {
  const response = await fetch(
    process.env.REACT_APP_STORE_ID_FETCH_URL as string,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId: locationId,
        locale: locale,
      }),
    },
  );
  return response;
};

export const parseDateString = (dateStr: string): string => {
  dateStr = new Date(dateStr).toString();
  const parts = dateStr.split(" ");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = parseInt(parts[2], 10);
  const month = monthNames.indexOf(parts[1]);
  const year = parseInt(parts[3], 10);
  return `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const calculateDaysDiff = (startDate: Date, endDate: Date) => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatDateToTH = (dateObj: Date) => {
  const yyyymmdd = `${dateObj.getFullYear()}${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${dateObj.getDate().toString().padStart(2, "0")}`;
  return yyyymmdd;
};
