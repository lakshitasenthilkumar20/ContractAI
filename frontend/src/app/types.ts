
export type ContractStatus =
  | "Uploaded"
  | "Under Review"
  | "Analyzed"
  | "Analysed"
  | "Accepted"
  | "Rejected"
  | "Summary Ready"
  | "Requires Revision";

export type ClientStatus = "Active" | "Inactive" | "Pending";

export interface Contract {
  id: string;
  contractName: string;
  clientName: string;
  uploadDate: string;
  contractType: string;
  status: ContractStatus;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  contractsAssigned: number;
  status: ClientStatus;
}

export interface Paralegal {
  id: string;
  name: string;
  email: string;
  contractsAssigned: number;
  status: ClientStatus; // Reusing status type for simplicity
}
