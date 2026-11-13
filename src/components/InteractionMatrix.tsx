import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import type { EvaluatedDrugPair } from '../types/rxcheck';

interface InteractionMatrixProps {
  drugs: string[];
  results: EvaluatedDrugPair[];
  onSelectPair?: (drugA: string, drugB: string) => void;
}

export const InteractionMatrix: React.FC<InteractionMatrixProps> = ({
  drugs,
  results,
  onSelectPair,
}) => {
  const theme = useTheme();
  if (drugs.length < 3) return null;

  const findPairResult = (d1: string, d2: string): EvaluatedDrugPair | undefined => {
    const name1 = d1.toLowerCase();
    const name2 = d2.toLowerCase();
    return results.find(
      r =>
        (r.drug1.toLowerCase() === name1 && r.drug2.toLowerCase() === name2) ||
        (r.drug1.toLowerCase() === name2 && r.drug2.toLowerCase() === name1)
    );
  };

  const getCellColor = (res?: EvaluatedDrugPair) => {
    if (!res) return { bg: 'transparent', text: theme.palette.text.disabled, label: '-' };
    if (res.severity === 'major' || res.isHighPriority) {
      return { bg: theme.palette.error.main, text: '#ffffff', label: 'MAJOR' };
    }
    if (res.severity === 'moderate') {
      return { bg: theme.palette.warning.main, text: '#ffffff', label: 'MOD' };
    }
    if (res.severity === 'minor') {
      return { bg: theme.palette.info.main, text: '#ffffff', label: 'MIN' };
    }
    return {
      bg: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      text: theme.palette.text.secondary,
      label: 'NONE',
    };
  };

  return (
    <Card elevation={0} sx={{ mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <GridViewIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Multi-Drug Interaction Matrix ({drugs.length} Substances)
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Quick pairwise cross-check table. Click any cell to inspect clinical management details.
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                <TableCell sx={{ fontWeight: 700, width: 140 }}>Substance</TableCell>
                {drugs.map(d => (
                  <TableCell key={d} align="center" sx={{ fontWeight: 700, maxWidth: 120 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap>
                      {d}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {drugs.map((rowDrug, rowIndex) => (
                <TableRow key={rowDrug} hover>
                  <TableCell sx={{ fontWeight: 700, bgcolor: theme.palette.action.hover }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {rowDrug}
                    </Typography>
                  </TableCell>

                  {drugs.map((colDrug, colIndex) => {
                    const isDiagonal = rowIndex === colIndex;
                    const pair = !isDiagonal ? findPairResult(rowDrug, colDrug) : undefined;
                    const cell = getCellColor(pair);

                    if (isDiagonal) {
                      return (
                        <TableCell
                          key={colDrug}
                          align="center"
                          sx={{
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            color: 'text.disabled',
                            fontSize: '0.75rem',
                          }}
                        >
                          &bull;
                        </TableCell>
                      );
                    }

                    return (
                      <Tooltip
                        key={colDrug}
                        title={
                          pair
                            ? `${rowDrug} + ${colDrug}: ${pair.severity.toUpperCase()} (${pair.clinicalSignificance || 'No recorded interaction'})`
                            : `${rowDrug} + ${colDrug}`
                        }
                        arrow
                      >
                        <TableCell
                          align="center"
                          onClick={() => onSelectPair && onSelectPair(rowDrug, colDrug)}
                          sx={{
                            bgcolor: cell.bg,
                            color: cell.text,
                            fontWeight: 800,
                            fontSize: '0.68rem',
                            letterSpacing: '0.5px',
                            cursor: pair ? 'pointer' : 'default',
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              opacity: 0.85,
                            },
                          }}
                        >
                          {cell.label}
                        </TableCell>
                      </Tooltip>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
