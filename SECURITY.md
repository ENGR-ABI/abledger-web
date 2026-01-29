# Security Notes

## Known Vulnerabilities

### dompurify (via jsPDF dependency)

**Status**: Acknowledged - Low Risk  
**Package**: jsPDF (transitive dependency: dompurify)  
**Severity**: Moderate (CVE via dompurify)  

**Note**: The dompurify vulnerability exists via jsPDF transitive dependency. This is not exploitable in our use case due to the absence of user-supplied HTML rendering. We are monitoring upstream for fixes.

**References**:
- https://github.com/advisories/GHSA-vhxf-7vqr-mrjg

