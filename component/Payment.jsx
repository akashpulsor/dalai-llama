import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
//import RazorpayCheckout from 'react-native-razorpay';
//import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';

const Payment = () => {
  const [selectedCredits, setSelectedCredits] = useState(0);
  //const { confirmPayment, loading } = useConfirmPayment();

  const handleRazorpayPayment = () => {
    if (selectedCredits === 0) {
      Alert.alert('Error', 'Please select the amount of credits to purchase.');
      return;
    }

    const options = {

    };
  }
  const handleStripePayment = async () => {

  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor:'#d3d3d3' }}>
      <Text>Select the amount of credits to purchase:</Text>
      <Button title="10 Credits" onPress={() => setSelectedCredits(10)} />
      <Button title="20 Credits" onPress={() => setSelectedCredits(20)} />
      <Button title="50 Credits" onPress={() => setSelectedCredits(50)} />

      <View style={{ marginVertical: 10 }}>
        <Text>Payment Method:</Text>
        <Button title="Razorpay" onPress={handleRazorpayPayment} disabled={selectedCredits === 0} />
        <Button title="Stripe" onPress={handleStripePayment} disabled={selectedCredits === 0 || loading} />
      </View>
    </View>
  );
};

export default Payment;
