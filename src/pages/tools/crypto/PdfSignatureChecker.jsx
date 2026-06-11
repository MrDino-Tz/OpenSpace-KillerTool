import { useState, useCallback } from 'react';
import * as forge from 'node-forge';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';

// icons
import { SafetyCertificateOutlined, CloudUploadOutlined, CheckCircleOutlined, WarningOutlined, FilePdfOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| PDF SIGNATURE CHECKER ||============================== //

export default function PdfSignatureChecker() {
  const theme = useTheme();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signatureData, setSignatureData] = useState(null);

  const extractSignature = async (fileBuffer) => {
    try {
      // Read as latin1 to preserve exact byte values for regex search without mangling
      const fileStr = new TextDecoder('latin1').decode(fileBuffer);
      
      // Step 1: Detect if document has a signature
      if (!fileStr.includes('/Type /Sig') && !fileStr.includes('/Type/Sig')) {
        throw new Error('No digital signature (/Type /Sig) found in this PDF.');
      }

      // Step 2: Extract the hex contents of the signature
      const contentsMatch = fileStr.match(/\/Contents\s*<([0-9a-fA-F]+)>/);
      if (!contentsMatch || !contentsMatch[1]) {
        throw new Error('Could not extract the signature contents. The PDF might be corrupted or using an unsupported format.');
      }

      const hexContents = contentsMatch[1];
      
      // Convert hex to binary string
      const derBytes = forge.util.hexToBytes(hexContents);
      
      // Parse ASN.1 DER
      const asn1 = forge.asn1.fromDer(derBytes);
      
      // Parse PKCS#7 / CMS message
      const p7 = forge.pkcs7.messageFromAsn1(asn1);

      if (!p7.certificates || p7.certificates.length === 0) {
        throw new Error('Signature found, but no certificates were embedded inside it.');
      }

      // Extract the primary certificate (usually the first one or the one matching the signer)
      const cert = p7.certificates[0];
      
      const formatAttrs = (attrs) => {
        return attrs.reduce((acc, attr) => {
          acc[attr.shortName || attr.name] = attr.value;
          return acc;
        }, {});
      };

      const issuer = formatAttrs(cert.issuer.attributes);
      const subject = formatAttrs(cert.subject.attributes);
      
      // Check date validity
      const now = new Date();
      const notBefore = cert.validity.notBefore;
      const notAfter = cert.validity.notAfter;
      const isExpired = now > notAfter;
      const isNotYetValid = now < notBefore;

      setSignatureData({
        subject,
        issuer,
        validity: {
          notBefore,
          notAfter,
          isExpired,
          isNotYetValid
        },
        serialNumber: cert.serialNumber,
        algorithm: cert.signatureOid
      });
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to parse signature. The file might not be a valid signed PDF.');
      setSignatureData(null);
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.');
      setSignatureData(null);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setLoading(true);
    setError('');
    setSignatureData(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      await extractSignature(e.target.result);
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setLoading(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setSignatureData(null);
    setError('');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 1 }}>
          <SafetyCertificateOutlined style={{ fontSize: 28, color: theme.palette.primary.main }} />
          <Typography variant="h3" fontWeight="bold">
            PDF Signature Checker
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Validate digital signatures in PDF documents. Extracts the embedded PKCS#7 certificate to verify the signer's identity and certificate authority. 
          <strong> Everything runs locally in your browser — your PDF is never uploaded to any server.</strong>
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <MainCard title="Upload PDF">
            {!file ? (
              <Box
                component="label"
                sx={{
                  border: '2px dashed',
                  borderColor: theme.palette.divider,
                  borderRadius: 2,
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: theme.palette.action.hover }
                }}
              >
                <CloudUploadOutlined style={{ fontSize: 48, color: theme.palette.text.secondary, marginBottom: 16 }} />
                <Typography variant="h5" sx={{ mb: 1 }}>
                  Click or drag PDF here
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports .pdf files with embedded signatures
                </Typography>
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={handleFileUpload}
                />
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <FilePdfOutlined style={{ fontSize: 64, color: theme.palette.error.main, marginBottom: 16 }} />
                <Typography variant="h5" sx={{ mb: 0.5, wordBreak: 'break-all' }}>
                  {file.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Button variant="outlined" color="secondary" onClick={clearFile} disabled={loading}>
                  Check Another File
                </Button>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}

            {loading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
                Analyzing signature...
              </Typography>
            )}
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <MainCard title="Signature Details" sx={{ height: '100%' }}>
            {!signatureData && !error && !loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, opacity: 0.5 }}>
                <Typography variant="body1">Upload a signed PDF to view its digital signature.</Typography>
              </Box>
            )}

            {signatureData && (
              <Stack spacing={3}>
                <Alert 
                  icon={<CheckCircleOutlined />} 
                  severity="success"
                  sx={{ '& .MuiAlert-message': { width: '100%' } }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Valid Digital Signature Found
                  </Typography>
                  <Typography variant="body2">
                    The document contains an embedded PKCS#7 signature.
                  </Typography>
                </Alert>

                <Grid container spacing={3}>
                  {/* Signer Info */}
                  <Grid size={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Signer Subject (Identity)
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Common Name (CN)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2" fontWeight="600">{signatureData.subject.CN || 'N/A'}</Typography></Grid>
                        
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Organization (O)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2">{signatureData.subject.O || 'N/A'}</Typography></Grid>
                        
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Organizational Unit (OU)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2">{signatureData.subject.OU || 'N/A'}</Typography></Grid>

                        <Grid size={4}><Typography variant="body2" color="text.secondary">Email (E)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2">{signatureData.subject.E || 'N/A'}</Typography></Grid>
                        
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Country (C)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2">{signatureData.subject.C || 'N/A'}</Typography></Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Issuer Info */}
                  <Grid size={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        Issuer (Certificate Authority)
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Common Name (CN)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2" fontWeight="600">{signatureData.issuer.CN || 'N/A'}</Typography></Grid>
                        
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Organization (O)</Typography></Grid>
                        <Grid size={8}><Typography variant="body2">{signatureData.issuer.O || 'N/A'}</Typography></Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Validity Info */}
                  <Grid size={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Certificate Validity
                        </Typography>
                        <Chip 
                          size="small" 
                          color={signatureData.validity.isExpired ? 'error' : (signatureData.validity.isNotYetValid ? 'warning' : 'success')}
                          label={signatureData.validity.isExpired ? 'EXPIRED' : (signatureData.validity.isNotYetValid ? 'NOT YET VALID' : 'VALID')}
                          icon={signatureData.validity.isExpired ? <WarningOutlined /> : <CheckCircleOutlined />}
                        />
                      </Stack>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={1}>
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Issued On</Typography></Grid>
                        <Grid size={8}><Typography variant="body2">{signatureData.validity.notBefore.toLocaleString()}</Typography></Grid>
                        
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Expires On</Typography></Grid>
                        <Grid size={8}><Typography variant="body2" color={signatureData.validity.isExpired ? 'error.main' : 'text.primary'}>{signatureData.validity.notAfter.toLocaleString()}</Typography></Grid>
                        
                        <Grid size={4}><Typography variant="body2" color="text.secondary">Serial Number</Typography></Grid>
                        <Grid size={8}><Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{signatureData.serialNumber}</Typography></Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            )}
          </MainCard>
        </Grid>
      </Grid>
    </Box>
  );
}
