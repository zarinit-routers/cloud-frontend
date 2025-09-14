export interface Organization {
  id: string;
  name: string;
  passphrase: string;
  creationDate: string;
  lastUpdate: string;
  members: Member[];
}

export interface Member {
  userId: string;
  createdAt: string;
  user?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface OrganizationsResponse {
  organizations: Organization[];
}

export interface UsersResponse {
  users: User[];
}