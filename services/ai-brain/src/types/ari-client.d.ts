declare module 'ari-client' {
    export function connect(
        url: string,
        user: string,
        password: string
    ): Promise<any>;
}
