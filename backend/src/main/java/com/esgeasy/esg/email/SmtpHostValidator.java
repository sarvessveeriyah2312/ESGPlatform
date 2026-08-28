package com.esgeasy.esg.email;

import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;

/**
 * Guards every SMTP host this backend ever connects to (tenant "bring your own SMTP" and the
 * platform default) against SSRF: a host that resolves to a loopback, link-local (including the
 * 169.254.169.254 cloud-metadata range), private/site-local, multicast, or wildcard address is
 * rejected. This is a denylist of reserved ranges rather than an allowlist of known providers,
 * since the feature is explicitly "connect to any external mail relay the tenant owns."
 */
@Component
public class SmtpHostValidator {

    public void assertPubliclyRoutable(String host) {
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(host);
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("SMTP host \"" + host + "\" could not be resolved");
        }

        for (InetAddress address : addresses) {
            if (address.isLoopbackAddress() || address.isLinkLocalAddress() || address.isSiteLocalAddress()
                    || address.isMulticastAddress() || address.isAnyLocalAddress()) {
                throw new IllegalArgumentException("SMTP host must be a publicly routable address");
            }
        }
    }
}
