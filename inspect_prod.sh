#!/bin/bash
echo "Content of /var/www/finances.tbelt.online/api/package.json:"
cat /var/www/finances.tbelt.online/api/package.json
echo "--------------------------------"
echo "Listing /var/www/finances.tbelt.online/html/:"
ls -F /var/www/finances.tbelt.online/html/ || echo "html dir empty or not found"
