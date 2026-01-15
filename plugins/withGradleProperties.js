const { withGradleProperties } = require("expo/config-plugins");

module.exports = function withOptimizedGradleProperties(config) {
    return withGradleProperties(config, (config) => {
        // Remove any existing entries we want to set
        config.modResults = config.modResults.filter(
            (item) =>
                !["org.gradle.jvmargs", "org.gradle.parallel", "org.gradle.caching", "org.gradle.daemon"].includes(item.key)
        );

        // Add optimized memory settings for builds with heavy native modules
        config.modResults.push(
            {
                type: "property",
                key: "org.gradle.jvmargs",
                value: "-Xmx4g -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8",
            },
            {
                type: "property",
                key: "org.gradle.parallel",
                value: "true",
            },
            {
                type: "property",
                key: "org.gradle.caching",
                value: "true",
            },
            {
                type: "property",
                key: "org.gradle.daemon",
                value: "true",
            }
        );

        return config;
    });
};
