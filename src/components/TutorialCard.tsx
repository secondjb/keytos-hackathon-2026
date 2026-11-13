import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  AlertTitle,
  Divider,
  Stack,
  useTheme,
  Button,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

interface TutorialCardProps {
  onLoadExample?: (drugs: string[]) => void;
}

export const TutorialCard: React.FC<TutorialCardProps> = ({ onLoadExample }) => {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        height: '100%',
        bgcolor: 'background.paper',
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              p: 1.2,
              borderRadius: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(237, 207, 181, 0.15)' : 'rgba(2, 132, 199, 0.1)',
              color: 'primary.main',
              display: 'flex',
            }}
          >
            <HealthAndSafetyIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              How to Use RxCheck
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Clinical Polypharmacy & Drug Interaction Verification System
            </Typography>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
          RxCheck analyzes complex regimens by evaluating all pairwise interactions between medications,
          lifestyle substances, and supplements directly from the active RxCheck medical database.
        </Typography>

        {/* 3 Step Tutorial: Circles vertically centered with text */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'primary.main', mb: 2 }}>
          Quick Guide & Steps:
        </Typography>

        <Stack spacing={2.5} sx={{ mb: 3.5 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              1
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Search & Add Substances
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Type in the search field on the left to search by brand or generic name. Select at least 2 items.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              2
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Run Interaction Evaluation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click <strong>&ldquo;Check Interactions&rdquo;</strong>. RxCheck evaluates every unique pair in your regimen.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              3
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Review Clinical Guidance & Triage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inspect severity rankings, biological mechanisms, and dynamic symptom warnings. Generate a printable summary for your physician.
              </Typography>
            </Box>
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Mandatory Clinical Disclaimers */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', mb: 1.5 }}>
          Important Clinical Disclaimers:
        </Typography>

        <Stack spacing={2}>
          <Alert severity="warning" variant="outlined" icon={<WarningAmberIcon />} sx={{ boxShadow: 'none' }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Consult Your Healthcare Provider</AlertTitle>
            RxCheck does not replace professional clinical judgment. If dangerous drug interactions or
            <strong> no results </strong> are returned, you must check with your physician or pharmacist.
            An absence of an interaction in the dataset does <strong>NOT</strong> establish safety.
          </Alert>

          <Alert severity="info" variant="outlined" icon={<LocalHospitalIcon />} sx={{ boxShadow: 'none' }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Emergency Services</AlertTitle>
            If you are experiencing severe adverse symptoms such as difficulty breathing, sudden severe
            chest pain, or signs of internal bleeding, call <strong>911</strong> immediately or contact Poison Help at <strong>1-800-222-1222</strong>.
          </Alert>
        </Stack>

        {onLoadExample && (
          <Box sx={{ mt: 3, pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<SearchIcon />}
              onClick={() => onLoadExample(['Aspirin (Acetylsalicylic acid)', 'Warfarin'])}
              sx={{ fontWeight: 600 }}
            >
              Load Example Regimen (Aspirin + Warfarin)
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
