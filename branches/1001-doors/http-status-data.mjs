// SPDX-License-Identifier: CC0-1.0
// Factual IANA protocol registry snapshot; original CSV retained.
export const HTTP_SOURCE = {
  sourceId: "IANA_HTTP",
  url: "https://www.iana.org/assignments/http-status-codes/http-status-codes-1.csv",
  landingPage: "https://www.iana.org/assignments/http-status-codes",
  license: "CC0-1.0",
  licenseSource: "https://www.iana.org/help/licensing-terms",
  registryLastUpdated: "2025-09-15",
  retrievedAt: "2026-10-23T16:55:07.168673+02:00",
  sha256: "6098f56a5f25ca050313838886090a5e58a40ca72c2b44eb19d5ac7c9f6b4896",
  bytes: 3334,
  rows: 75,
};
export const HTTP_ROWS = [
  {
    Value: "100",
    Description: "Continue",
    Reference: "[RFC 9110, Section 15.2.1]",
  },
  {
    Value: "101",
    Description: "Switching Protocols",
    Reference: "[RFC 9110, Section 15.2.2]",
  },
  {
    Value: "102",
    Description: "Processing",
    Reference: "[RFC 2518]",
  },
  {
    Value: "103",
    Description: "Early Hints",
    Reference: "[RFC 8297]",
  },
  {
    Value: "104",
    Description:
      "Upload Resumption Supported (TEMPORARY - registered 2024-11-13, extension registered 2025-09-15, expires 2026-11-13)",
    Reference: "[draft-ietf-httpbis-resumable-upload-05]",
  },
  {
    Value: "105-199",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "200",
    Description: "OK",
    Reference: "[RFC 9110, Section 15.3.1]",
  },
  {
    Value: "201",
    Description: "Created",
    Reference: "[RFC 9110, Section 15.3.2]",
  },
  {
    Value: "202",
    Description: "Accepted",
    Reference: "[RFC 9110, Section 15.3.3]",
  },
  {
    Value: "203",
    Description: "Non-Authoritative Information",
    Reference: "[RFC 9110, Section 15.3.4]",
  },
  {
    Value: "204",
    Description: "No Content",
    Reference: "[RFC 9110, Section 15.3.5]",
  },
  {
    Value: "205",
    Description: "Reset Content",
    Reference: "[RFC 9110, Section 15.3.6]",
  },
  {
    Value: "206",
    Description: "Partial Content",
    Reference: "[RFC 9110, Section 15.3.7]",
  },
  {
    Value: "207",
    Description: "Multi-Status",
    Reference: "[RFC 4918]",
  },
  {
    Value: "208",
    Description: "Already Reported",
    Reference: "[RFC 5842]",
  },
  {
    Value: "209-225",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "226",
    Description: "IM Used",
    Reference: "[RFC 3229]",
  },
  {
    Value: "227-299",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "300",
    Description: "Multiple Choices",
    Reference: "[RFC 9110, Section 15.4.1]",
  },
  {
    Value: "301",
    Description: "Moved Permanently",
    Reference: "[RFC 9110, Section 15.4.2]",
  },
  {
    Value: "302",
    Description: "Found",
    Reference: "[RFC 9110, Section 15.4.3]",
  },
  {
    Value: "303",
    Description: "See Other",
    Reference: "[RFC 9110, Section 15.4.4]",
  },
  {
    Value: "304",
    Description: "Not Modified",
    Reference: "[RFC 9110, Section 15.4.5]",
  },
  {
    Value: "305",
    Description: "Use Proxy",
    Reference: "[RFC 9110, Section 15.4.6]",
  },
  {
    Value: "306",
    Description: "(Unused)",
    Reference: "[RFC 9110, Section 15.4.7]",
  },
  {
    Value: "307",
    Description: "Temporary Redirect",
    Reference: "[RFC 9110, Section 15.4.8]",
  },
  {
    Value: "308",
    Description: "Permanent Redirect",
    Reference: "[RFC 9110, Section 15.4.9]",
  },
  {
    Value: "309-399",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "400",
    Description: "Bad Request",
    Reference: "[RFC 9110, Section 15.5.1]",
  },
  {
    Value: "401",
    Description: "Unauthorized",
    Reference: "[RFC 9110, Section 15.5.2]",
  },
  {
    Value: "402",
    Description: "Payment Required",
    Reference: "[RFC 9110, Section 15.5.3]",
  },
  {
    Value: "403",
    Description: "Forbidden",
    Reference: "[RFC 9110, Section 15.5.4]",
  },
  {
    Value: "404",
    Description: "Not Found",
    Reference: "[RFC 9110, Section 15.5.5]",
  },
  {
    Value: "405",
    Description: "Method Not Allowed",
    Reference: "[RFC 9110, Section 15.5.6]",
  },
  {
    Value: "406",
    Description: "Not Acceptable",
    Reference: "[RFC 9110, Section 15.5.7]",
  },
  {
    Value: "407",
    Description: "Proxy Authentication Required",
    Reference: "[RFC 9110, Section 15.5.8]",
  },
  {
    Value: "408",
    Description: "Request Timeout",
    Reference: "[RFC 9110, Section 15.5.9]",
  },
  {
    Value: "409",
    Description: "Conflict",
    Reference: "[RFC 9110, Section 15.5.10]",
  },
  {
    Value: "410",
    Description: "Gone",
    Reference: "[RFC 9110, Section 15.5.11]",
  },
  {
    Value: "411",
    Description: "Length Required",
    Reference: "[RFC 9110, Section 15.5.12]",
  },
  {
    Value: "412",
    Description: "Precondition Failed",
    Reference: "[RFC 9110, Section 15.5.13]",
  },
  {
    Value: "413",
    Description: "Content Too Large",
    Reference: "[RFC 9110, Section 15.5.14]",
  },
  {
    Value: "414",
    Description: "URI Too Long",
    Reference: "[RFC 9110, Section 15.5.15]",
  },
  {
    Value: "415",
    Description: "Unsupported Media Type",
    Reference: "[RFC 9110, Section 15.5.16]",
  },
  {
    Value: "416",
    Description: "Range Not Satisfiable",
    Reference: "[RFC 9110, Section 15.5.17]",
  },
  {
    Value: "417",
    Description: "Expectation Failed",
    Reference: "[RFC 9110, Section 15.5.18]",
  },
  {
    Value: "418",
    Description: "(Unused)",
    Reference: "[RFC 9110, Section 15.5.19]",
  },
  {
    Value: "419-420",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "421",
    Description: "Misdirected Request",
    Reference: "[RFC 9110, Section 15.5.20]",
  },
  {
    Value: "422",
    Description: "Unprocessable Content",
    Reference: "[RFC 9110, Section 15.5.21]",
  },
  {
    Value: "423",
    Description: "Locked",
    Reference: "[RFC 4918]",
  },
  {
    Value: "424",
    Description: "Failed Dependency",
    Reference: "[RFC 4918]",
  },
  {
    Value: "425",
    Description: "Too Early",
    Reference: "[RFC 8470]",
  },
  {
    Value: "426",
    Description: "Upgrade Required",
    Reference: "[RFC 9110, Section 15.5.22]",
  },
  {
    Value: "427",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "428",
    Description: "Precondition Required",
    Reference: "[RFC 6585]",
  },
  {
    Value: "429",
    Description: "Too Many Requests",
    Reference: "[RFC 6585]",
  },
  {
    Value: "430",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "431",
    Description: "Request Header Fields Too Large",
    Reference: "[RFC 6585]",
  },
  {
    Value: "432-450",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "451",
    Description: "Unavailable For Legal Reasons",
    Reference: "[RFC 7725]",
  },
  {
    Value: "452-499",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "500",
    Description: "Internal Server Error",
    Reference: "[RFC 9110, Section 15.6.1]",
  },
  {
    Value: "501",
    Description: "Not Implemented",
    Reference: "[RFC 9110, Section 15.6.2]",
  },
  {
    Value: "502",
    Description: "Bad Gateway",
    Reference: "[RFC 9110, Section 15.6.3]",
  },
  {
    Value: "503",
    Description: "Service Unavailable",
    Reference: "[RFC 9110, Section 15.6.4]",
  },
  {
    Value: "504",
    Description: "Gateway Timeout",
    Reference: "[RFC 9110, Section 15.6.5]",
  },
  {
    Value: "505",
    Description: "HTTP Version Not Supported",
    Reference: "[RFC 9110, Section 15.6.6]",
  },
  {
    Value: "506",
    Description: "Variant Also Negotiates",
    Reference: "[RFC 2295]",
  },
  {
    Value: "507",
    Description: "Insufficient Storage",
    Reference: "[RFC 4918]",
  },
  {
    Value: "508",
    Description: "Loop Detected",
    Reference: "[RFC 5842]",
  },
  {
    Value: "509",
    Description: "Unassigned",
    Reference: "",
  },
  {
    Value: "510",
    Description: "Not Extended (OBSOLETED)",
    Reference: "[RFC 2774]; [Status change of HTTP experiments to Historic]",
  },
  {
    Value: "511",
    Description: "Network Authentication Required",
    Reference: "[RFC 6585]",
  },
  {
    Value: "512-599",
    Description: "Unassigned",
    Reference: "",
  },
];
