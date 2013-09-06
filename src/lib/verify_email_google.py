import DNS
from validate_email import validate_email


def is_google_apps_email(email):
  hostname = email[email.find('@')+1:]
  
  try:
    mx_hosts = DNS.mxlookup(hostname)
  except DNS.ServerError as e:
    return False
  
  for mx in mx_hosts:
    _, host_server = mx
    if 'google' in str(host_server).lower() and 'aspmx' in str(host_server).lower():
      return True
    
  return False
