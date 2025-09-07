type Node = {
    id: string;
    name: string;
    tags: string[];
};

type Response = {
    data: {};
    requestError: string;
    commandError: string;
};
export type { Node, Response };
