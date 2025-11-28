import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const DOCUMENT_ID = 'shared-timesheet';
const COLLECTION_NAME = 'timesheets';

export const useFirestore = () => {
  const [timeData, setTimeData] = useState({});
  const [linkedInData, setLinkedInData] = useState({});
  const [config, setConfig] = useState({
    activities: ['LinkedIn Stuff'],
    maxHours: 2
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
    
    const initializeDoc = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          // Create initial document if it doesn't exist
          await setDoc(docRef, {
            timeData: {},
            linkedInData: {},
            config: {
              activities: ['LinkedIn Stuff'],
              maxHours: 2
            },
            lastUpdated: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Error initializing document:', err);
      }
    };
    
    initializeDoc();
    
    const unsubscribe = onSnapshot(docRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setTimeData(data.timeData || {});
          setLinkedInData(data.linkedInData || {});
          setConfig(data.config || {
            activities: ['LinkedIn Stuff'],
            maxHours: 2
          });
        } else {
          // Document doesn't exist, use defaults
          setTimeData({});
          setLinkedInData({});
          setConfig({
            activities: ['LinkedIn Stuff'],
            maxHours: 2
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
        linkedInData,
        config,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setTimeData(newTimeData);
    } catch (err) {
      console.error('Error updating timesheet:', err);
      setError(err.message);
    }
  };

  const updateLinkedInData = async (newLinkedInData) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      await setDoc(docRef, { 
        timeData,
        linkedInData: newLinkedInData,
        config,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      setLinkedInData(newLinkedInData);
    } catch (err) {
      console.error('Error updating LinkedIn data:', err);
      setError(err.message);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      await setDoc(docRef, { 
        timeData,
        linkedInData,
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
    linkedInData,
    config,
    loading,
    error,
    updateTimeData,
    updateLinkedInData,
    updateConfig
  };
};