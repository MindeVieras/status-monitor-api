
import dns from 'dns'

// get IP from hostname/domain
export function getIp(hostname) {
  return new Promise((resolve, reject) => {

    dns.lookup(hostname, (err, address, family) => {
      if (err) {
        reject(`Cannot get host IP address: ${err.code}`)
      }

      resolve(address)
    })

  })
}
