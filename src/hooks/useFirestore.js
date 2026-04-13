import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const DOCUMENT_ID = 'points';
const COLLECTION_NAME = 'scoreboard';

export const useFirestore = () => {
  const [scores, setScores] = useState({ andrew: 0, veronica: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);

    const initializeDoc = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, {
            andrew: 0,
            veronica: 0,
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
          setScores({
            andrew: data.andrew ?? 0,
            veronica: data.veronica ?? 0
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

  const updateScore = async (person, delta) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);
      const newScore = scores[person] + delta;
      await updateDoc(docRef, {
        [person]: newScore,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating score:', err);
      setError(err.message);
    }
  };

  return { scores, loading, error, updateScore };
};
