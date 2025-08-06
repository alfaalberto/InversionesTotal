'use client';

import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Stock } from './data';
import { rawInitialPortfolioData } from './data';

const portfolioCollectionRef = collection(db, 'portfolio');

async function addInitialPortfolioToFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    rawInitialPortfolioData.forEach(assetData => {
      const docRef = doc(portfolioCollectionRef);
      batch.set(docRef, { ...assetData, currentPrice: assetData.purchasePrice });
    });
    await batch.commit();
    console.log('Initial portfolio has been added to Firestore.');
  } catch (error) {
    console.error('Error adding initial portfolio to Firestore: ', error);
  }
}

export async function getPortfolioFromFirestore(): Promise<Stock[]> {
  try {
    const snapshot = await getDocs(portfolioCollectionRef);
    if (snapshot.empty) {
        await addInitialPortfolioToFirestore();
        const newSnapshot = await getDocs(portfolioCollectionRef);
        return newSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stock));
    }
    const portfolio: Stock[] = [];
    snapshot.forEach(doc => {
      portfolio.push({ id: doc.id, ...doc.data() } as Stock);
    });
    return portfolio;
  } catch (error) {
    console.error('Error getting portfolio from Firestore: ', error);
    return [];
  }
}

export async function addAssetToFirestore(asset: Omit<Stock, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(portfolioCollectionRef, asset);
    return docRef.id;
  } catch (error) {
    console.error('Error adding asset to Firestore: ', error);
    throw error;
  }
}

export async function updateAssetInFirestore(id: string, dataToUpdate: Partial<Omit<Stock, 'id'>>): Promise<void> {
    try {
        const assetDoc = doc(db, 'portfolio', id);
        await updateDoc(assetDoc, dataToUpdate);
    } catch (error) {
        console.error('Error updating asset in Firestore: ', error);
        throw error;
    }
}

export async function deleteAssetFromFirestore(id: string): Promise<void> {
  try {
    const assetDoc = doc(db, 'portfolio', id);
    await deleteDoc(assetDoc);
  } catch (error) {
    console.error('Error deleting asset from Firestore: ', error);
    throw error;
  }
}
