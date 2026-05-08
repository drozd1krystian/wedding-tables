import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';
import { loadProject, debouncedSave } from './lib/projectSync';
import AuthPage from './components/AuthPage';
import App from './App';

export default function Root() {
  const { session, loading, init } = useAuthStore();
  const { loadProjectData, projectName, projectDate, tables, guests, assignments } = useStore();
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  // Load from Supabase when user logs in
  useEffect(() => {
    if (!session?.user) {
      setDataLoaded(false);
      return;
    }
    loadProject(session.user.id).then((data) => {
      if (data) loadProjectData(data);
      setDataLoaded(true);
    });
  }, [session?.user?.id]);

  // Save to Supabase on every data change (debounced)
  useEffect(() => {
    if (!session?.user || !dataLoaded) return;
    debouncedSave(session.user.id, { projectName, projectDate, tables, guests, assignments });
  }, [projectName, projectDate, tables, guests, assignments, dataLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Ładowanie...</p>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Ładowanie projektu...</p>
      </div>
    );
  }

  return <App />;
}
