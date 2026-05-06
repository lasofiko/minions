import {Navigate} from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';

export const ProtectedRoute = ({children}) => {
    const {isAuthenticated, loading} = useAuth();

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace/>;
    }

    return children;
};