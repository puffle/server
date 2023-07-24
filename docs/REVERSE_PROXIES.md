# Reverse proxies

The most recommended way to expose the servers to the Internet is through a reverse proxy.

A reverse proxy guarantees extra security by not having to expose the servers directly and also allows better management of ratelimits.

To start using a reverse proxy, go to your configuration file and activate the required option.

```json
{
	"reverseProxy": {
		"enabled": false,				// Toggle the reverse proxy config.
		"ipHeader": "X-Forwarded-For",	// The header to be used to obtain the real IP of the user
		"separator": ","				// If the header is an array, this delimiter will be used to separate the IP addresses
	},
}
```

### ⚠️ Warning

Please note that blindly relying on an IP header leads to a security risk. Please verify, sanitize and correctly evaluate the IP header you wish to use.

References:
- https://portswigger.net/kb/issues/00400110_spoofable-client-ip-address
- https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_Host_Header_Injection
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For#security_and_privacy_concerns
- https://security.stackexchange.com/questions/254199/how-to-prevent-spoofing-of-x-forwarded-for-header
- https://totaluptime.com/kb/prevent-x-forwarded-for-spoofing-or-manipulation/
- https://www.stackhawk.com/blog/do-you-trust-your-x-forwarded-for-header/