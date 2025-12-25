import { onAuthStateChanged } from "firebase/auth";
import {auth} from '../lib/firebase';
import {doc , getDoc} from 'firebase/firestore';
import { db } from "../lib/firebase";
import { Children, useEffect, useState, createContext } from "react";


export const AuthContext = createContext();

export const AuthProvider = ({children})=>{
    const [firebaseUaer , setFirebaseUser] = useState(null);
    const [profile , setProfile] = useState(null);
    const [loading , setLoading] = useState(true);
    
    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth , async (user)=>{
            if(user){
                const ref = doc(db, 'users' , user.uid);
                const snap = await getDoc(ref);
                setFirebaseUser(user);
                setProfile(snap.exists()? snap.data() : null);

            }else{
                setFirebaseUser(null);
                setProfile(null);

            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ firebaseUaer, profile, loading }}>
            {children}
        </AuthContext.Provider>
    );
};