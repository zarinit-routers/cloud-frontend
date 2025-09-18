interface Preset {
    command: string;
    exampleBody: string;
}

const modemBody = JSON.stringify({
    modem: "modem1",
});

const diagnosticsBody = JSON.stringify({
    address: "ya.ru",
});

const PRESETS: Preset[] = [
    {
        command: "v1/timezone/get",
        exampleBody: "",
    },
    {
        command: "v1/timezone/set",
        exampleBody: JSON.stringify({
            timezone: "Europe/London",
        }),
    },
    {
        command: "v1/system/get-os-info",
        exampleBody: "",
    },
    {
        command: "v1/system/get-device-info",
        exampleBody: "",
    },
    {
        command: "v1/system/reboot",
        exampleBody: "",
    },
    {
        command: "v1/ssh/enable",
        exampleBody: "",
    },
    {
        command: "v1/ssh/disable",
        exampleBody: "",
    },
    {
        command: "v1/ssh/get-status",
        exampleBody: "",
    },
    {
        command: "v1/journals/get",
        exampleBody: JSON.stringify({
            journal: "system",
        }),
    },
    {
        command: "v1/modems/list",
        exampleBody: "",
    },
    {
        command: "v1/modems/enable",
        exampleBody: modemBody,
    },
    {
        command: "v1/modems/disable",
        exampleBody: modemBody,
    },
    {
        command: "v1/modems/get-signal",
        exampleBody: modemBody,
    },
    {
        command: "v1/sim/get",
        exampleBody: JSON.stringify({
            sim: "sim1",
        }),
    },
    {
        command: "v1/diagnostics/run-ping",
        exampleBody: diagnosticsBody,
    },
    {
        command: "v1/diagnostics/run-nslookup",
        exampleBody: diagnosticsBody,
    },
    {
        command: "v1/diagnostics/run-traceroute",
        exampleBody: diagnosticsBody,
    },
];
export { PRESETS };
