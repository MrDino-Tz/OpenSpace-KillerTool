import { createBrowserRouter } from 'react-router-dom';

// project imports
import MainRoutes from './MainRoutes';

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter([MainRoutes], { basename: import.meta.env.BASE_URL });

export default router;
