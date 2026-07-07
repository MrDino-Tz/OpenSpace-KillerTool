import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Stack, Select, MenuItem,
  FormControl, InputLabel, Alert, Snackbar
} from '@mui/material';
import { BulbOutlined } from '@ant-design/icons';
import { useTheme } from '@mui/material/styles';

export default function SuggestDialog({ open, onClose }) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('feature');
  const [description, setDescription] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;
    setTitle('');
    setCategory('feature');
    setDescription('');
    setSnackOpen(true);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <BulbOutlined style={{ fontSize: 24, color: theme.palette.warning.main }} />
            <Typography variant="h5" fontWeight={700}>Suggest a Feature</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={e => setCategory(e.target.value)}>
                <MenuItem value="feature">Feature Request</MenuItem>
                <MenuItem value="improvement">Improvement</MenuItem>
                <MenuItem value="bug">Not Working / Bug</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Title"
              placeholder="Brief title for your suggestion"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              rows={5}
              size="small"
              label="Description"
              placeholder="Describe your suggestion in detail..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <Alert severity="info" icon={<BulbOutlined />}>
              Your feedback helps improve this tool. Thank you!
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim()}
          >
            Submit Suggestion
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="Thank you for your suggestion!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </>
  );
}
