const defaultConfig = {
    algorithm: "fixedWindow",
    window: 60,
    limit: 5,

    keyGenerator : (req) => req.ip
};

export default defaultConfig;