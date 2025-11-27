import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const DOCUMENT_ID = 'shared-timesheet';
const COLLECTION_NAME = 'timesheets';

export const useFirestore = () => {
  const [timeData, setTimeData] = useState({});
  const [config, setConfig] = useState({
    activities: ['LinkedIn Stuff', 'Paid Vacation'],
    maxHours: 12
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    
    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTimeData(data.timeData || {});
          setConfig(data.config || {
            activities: ['LinkedIn Stuff', 'Paid Vacation'],
            maxHours: 12
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateTimeData = async (newTimeData) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      await setDoc(docRef, { 
        timeData: newTimeData, 
        config,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setTimeData(newTimeData);
    } catch (err) {
      console.error('Error updating timesheet:', err);
      setError(err.message);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      await setDoc(docRef, { 
        timeData,
        config: newConfig,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setConfig(newConfig);
    } catch (err) {
      console.error('Error updating config:', err);
      setError(err.message);
    }
  };

  return {
    timeData,
    config,
    loading,
    error,
    updateTimeData,
    updateConfig
  };
};