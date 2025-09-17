type Node = {
    id: string;
    name: string;
    tags: string[];
    connected: boolean;
    lastConnection: string;
    firstConnection: string;
};

type Response = {
    data: {};
    requestError: string;
    commandError: string;
};
export type { Node, Response };
