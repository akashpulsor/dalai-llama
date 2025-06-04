#!/bin/bash

# Audio Download Script
# Downloads raw audio from API endpoint and saves as MP3

# Configuration
URL="https://dalai-llama-backend-drd2b6e7a6gsa5e4.canadacentral-01.azurewebsites.net/api/campaign/27/recording"
BEARER_TOKEN="Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkaGFueWFAZ21haWwuY29tIiwiaXNzIjoiYmFja2VuZHN0b3J5LmNvbSIsImlhdCI6MTc0ODk0NTE1MiwiZXhwIjoxNzQ5MDMxNTUyfQ.Mwls-wNRvonXQloLBjq0zQrG0j2-o3OThsXflAud4EU"
OUTPUT_FILE="campaign_27_recording.mp3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting audio download...${NC}"

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed. Please install curl first.${NC}"
    exit 1
fi

# Download the audio file
echo -e "${YELLOW}Downloading from: ${URL}${NC}"
echo -e "${YELLOW}Saving as: ${OUTPUT_FILE}${NC}"

# Use curl to download with bearer token authentication
curl -H "Authorization: ${BEARER_TOKEN}" \
     -H "Accept: audio/mpeg, audio/*, */*" \
     -L \
     -o "${OUTPUT_FILE}" \
     "${URL}"

# Check if download was successful
if [ $? -eq 0 ] && [ -f "${OUTPUT_FILE}" ] && [ -s "${OUTPUT_FILE}" ]; then
    FILE_SIZE=$(ls -lh "${OUTPUT_FILE}" | awk '{print $5}')
    echo -e "${GREEN}✓ Download successful!${NC}"
    echo -e "${GREEN}File saved: ${OUTPUT_FILE} (${FILE_SIZE})${NC}"
    
    # Check if file is actually audio by looking at the first few bytes
    if file "${OUTPUT_FILE}" | grep -q "audio\|MP3\|MPEG"; then
        echo -e "${GREEN}✓ File appears to be valid audio${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: File may not be audio format. Check the content.${NC}"
    fi
    
else
    echo -e "${RED}✗ Download failed or file is empty${NC}"
    
    # Clean up empty file if it exists
    if [ -f "${OUTPUT_FILE}" ] && [ ! -s "${OUTPUT_FILE}" ]; then
        rm "${OUTPUT_FILE}"
        echo -e "${YELLOW}Removed empty file${NC}"
    fi
    exit 1
fi

echo -e "${GREEN}Audio download completed successfully!${NC}"
