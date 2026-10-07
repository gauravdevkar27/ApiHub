import dns from 'node:dns';
import net from 'node:net';
import ApiError from '../../utils/ApiError.js';

const SSRF_ERROR_CODE = 'ERR_SSRF_BLOCKED';

const blockList = new net.BlockList();

[
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
].forEach(([address, prefix]) => blockList.addSubnet(address, prefix, 'ipv4'));


[
   ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
].forEach(([address, prefix]) => blockList.addSubnet(address, prefix, 'ipv6'));


const allowPrivateNetworks = () => process.env.ALLOW_PRIVATE_NETWORKS === 'true';

const blockedError = () =>
    Object.assign(new Error('Blocked address.'), {code: SSRF_ERROR_CODE});

const unmapIPv4 = (ip) => {
    const lower = ip.toLowerCase();

    const dotted = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if(dotted) return dotted[1];
    
    const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if(hex){
        const hi = parseInt(hex[1],16);
        const lo = parseInt(hex[2],16);
        return `${hi>>8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
    }

    return ip;
}

export const isBlockedAddress = (address) =>{
    const ip = unmapIPv4(address.split('%')[0]);
    const family = net.isIP(ip);

    if(family === 0) return true;  //not a valid ip -> failed closed
    return blockList.check(ip, family === 6 ? 'ipv6' : 'ipv4');
};

export const assertSafeUrl = (rawUrl) =>{
    let parsed;
    try{
        parsed = new URL(rawUrl);
    }catch{
        throw new ApiError(400, 'Invalid URL.');
    }

    if(!['http:', 'https:'].includes(parsed.protocol)){
        throw new ApiError(400, 'Only http & https protocols are allowed.');
    }

    if(allowPrivateNetworks()) return parsed;

    const host = parsed.hostname.replace(/^\[|\]$/g, '');
    if(net.isIP(host) && isBlockedAddress(host)){
        throw new ApiError(403, 'Requests to private or internal network address are blocked.');
    }
    return parsed;
}

export const safeLookup = (hostname, options, callback) =>{
    dns.lookup(hostname, {...options, all: true}, (err, addresses) =>{
        if(err) return callback(err);
        
        if(!allowPrivateNetworks() && addresses.some((a) => isBlockedAddress(a.address))){
            return callback(blockedError());
        }
        
        if(options.all) return callback(null, addresses);

        const { address, family} = addresses[0];
        return callback(null, address, family);
    });
};

export const isSsrfError = (err) =>
    err?.code === SSRF_ERROR_CODE || err?.cause?.code === SSRF_ERROR_CODE;