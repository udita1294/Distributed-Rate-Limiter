export function setRateLimitHeaders(res,config,result) {
    // Legacy Headers
    if (config.legacyHeaders) {
        res.setHeader("X-RateLimit-Limit",config.limit);
        res.setHeader("X-RateLimit-Remaining",result.remaining);
        res.setHeader("Retry-After",result.retryAfter);
    }

    // RFC 9333 Headers
    if (config.standardHeaders) {
        res.setHeader("RateLimit-Limit",config.limit);
        res.setHeader("RateLimit-Remaining",result.remaining);
        res.setHeader("RateLimit-Reset",result.retryAfter);
    }

}