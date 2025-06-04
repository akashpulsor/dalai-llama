import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { showMessage } from './flashMessageSlice';
import { useNewsletterMutation } from './publicApi';
import { v4 as uuidv4 } from 'uuid';

const NewsletterForm = ({ onClose, initialData }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [closing, setClosing] = useState(false);
  const dispatch = useDispatch();
  const [addNewsletter, { isSuccess, isLoading, error }] = useNewsletterMutation(); 
  
  useEffect(() => {
    // Track newsletter form view on mount
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'newsletter_form_view', {
        event_category: 'Newsletter',
        event_label: 'Form Viewed',
        source: initialData?.source || 'web',
        uniqueId: initialData?.uniqueId || uuidv4(),
        campaign: initialData?.campaign || 'newsletter'
      });
    }
  }, [initialData]);
  useEffect(() => {
    if (isSuccess) {
      // Track successful newsletter submission
      if (window.gtag) {
        window.gtag('event', 'newsletter_submitted', {
          event_category: 'Newsletter',
          event_label: 'Success',
          email_domain: email.split('@')[1],
          source: initialData?.source || 'web',
          uniqueId: initialData?.uniqueId,
          campaign: 'newsletter'
        });
      }
      
      setSubmitted(true);
      dispatch(showMessage({
        message: 'Successfully subscribed to newsletter!',
        type: 'success'
      }));
      setTimeout(() => {
        onClose && onClose();
      }, 2000); // Close after 2 seconds
    }
  }, [isSuccess, email, initialData]);const handleSubmit = async (e) => {
    e.preventDefault && e.preventDefault();
    if (!email) return;
    
    try {
      const submissionData = {
        email,
        uniqueId: initialData?.uniqueId || uuidv4(),
        source: initialData?.source || 'web',
        campaign: 'newsletter'
      };

      await addNewsletter(submissionData);
    } catch (error) {
      dispatch(showMessage({
        message: 'Failed to subscribe. Please try again.',
        type: 'error'
      }));
    }
  };

  const handleClose = () => {
    if (!closing) {
      setClosing(true);
      setTimeout(() => {
        setClosing(false);
        onClose && onClose();
      }, 200); // allow for animation if needed
    }
  };

  return (
    <View style={{
      backgroundColor: '#f5f3ff', // match landing page bg
      borderRadius: 22,
      padding: 28,
      maxWidth: 380,
      width: '92%',
      margin: '0 auto',
      boxShadow: '0 8px 32px rgba(124,58,237,0.13)',
      alignItems: 'center',
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
      zIndex: 9999,
      borderWidth: 2,
      borderColor: '#7c3aed',
      borderStyle: 'solid',
      elevation: 10,
    }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#7c3aed', marginBottom: 8 }}>Subscribe to our Newsletter</Text>
      <Text style={{ fontSize: 15, color: '#333', marginBottom: 18, textAlign: 'center' }}>
        Get updates on Voice AI for ecommerce, product news, and more.
      </Text>
      {submitted ? (
        <Text style={{ color: '#43a047', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Thank you for subscribing!</Text>
      ) : (
        <>
          <TextInput
            style={{
              borderWidth: 1.5,
              borderColor: '#7c3aed',
              borderRadius: 10,
              padding: 12,
              width: '100%',
              marginBottom: 12,
              fontSize: 16,
              backgroundColor: '#fff',
            }}
            placeholder="Your email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#7c3aed',
              borderRadius: 10,
              paddingVertical: 13,
              alignItems: 'center',
              width: '100%',
              marginBottom: 8,
              shadowColor: '#7c3aed',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.13,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={handleSubmit}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Subscribe</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={handleClose} style={{ marginTop: 8, alignSelf: 'center' }}>
        <Text style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: 15 }}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NewsletterForm;
