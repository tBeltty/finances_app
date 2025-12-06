#!/bin/bash
echo "Listing /var/www/finances.tbelt.online:"
ls -F /var/www/finances.tbelt.online/
echo "--------------------------------"
echo "Listing /var/www/finances.tbelt.online/api/:"
ls -F /var/www/finances.tbelt.online/api/ || echo "api dir not found"
echo "--------------------------------"
echo "Listing /var/www/finances.tbelt.online/client/:"
ls -F /var/www/finances.tbelt.online/client/ || echo "client dir not found"
