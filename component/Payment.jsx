import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button,Image, TouchableOpacity, WebView  } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import styles from '../styles';
import logo from '../assets/logo.png';

import DropDownPicker from 'react-native-dropdown-picker';
import {useSelector} from "react-redux";
import {selectedLLm, selectLlmData, selectTools, selectUser} from "./authSlice";
import {useGetLlmQuery, useGetToolsQuery} from "./authApi";


const Payment = () => {
  const user =  useSelector(selectUser);
  const { data: tools, error: toolsError, isLoading: toolsLoading } = useGetToolsQuery();
  const { data: llmData, error: llmError, isLoading: llmsLoading } =useGetLlmQuery();
  const [openLlm, setOpenLlm] = useState(false);
  const [openTools, setOpenTools] = useState(false);
  const [llmValue, setLlmValue] = useState(null);
  const [toolValue, setToolValue] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // The empty dependency array ensures the effect runs only once, similar to componentDidMount
  const [activeOptions, setActiveOptions] = useState([]);

  useEffect(() => {
      if(tools) {
          setActiveOptions(tools.filter(option => option.active));
      }
  }, [tools]);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
     document.body.appendChild(script);
   });
};

useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js");
});
  //To be called from back end
  const createOrder = async () => {
    return {"orderId":"order_9A33XWu170gUtm"};
  }
  const handleRazorpayPayment = async () => {
    const order = await createOrder();

    var options = {
      "key": "", // Enter the Key ID generated from the Dashboard
      "amount": "50000", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      "currency": "INR",
      "name": "Acme Corp", //your business name
      "description": "Test Transaction",
      "image": "https://example.com/your_logo",
      "order_id": "order_9A33XWu170gUtm", //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
      "callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
      "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information especially their phone number
          "name": "Gaurav Kumar", //your customer's name
          "email": "gaurav.kumar@example.com",
          "contact": "9000090000" //Provide the customer's phone number for better conversion rates 
      },
      "notes": {
          "address": "Razorpay Corporate Office"
      },
      "theme": {
          "color": "#3399cc"
      }
  };
    const rzp1 = new window.Razorpay(options);;

    rzp1.on("payment.failed", function (response) {
      console.log(response.error.code);
      console.log(response.error.description);
      console.log(response.error.source);
      console.log(response.error.step);
      console.log(response.error.reason);
      console.log(response.error.metadata.order_id);
      console.log(response.error.metadata.payment_id);
    });
  
    rzp1.open();
  };


  return (
    <View style={[styles.container,{flexDirection:'row'}]}>
      <View  style={{justifyContent:'center',alignContent:'center'}}>
      <Image source={logo}
       style={{width: 400, height: 600, justifyContent:'center'}} />
      </View>

      <View  style={{justifyContent:'flex-start',alignContent:'center',flexDirection:'column'}}>
        <Text style={[{marginTop:'20%',marginBottom:'1%',color:'blue',fontSize:18}]}>To save your money, we have designed credit based billing system,</Text>
        <Text style={[{marginBottom:'1%',color:'blue',fontSize:18}]}>This allow you to have tight control on spending,</Text>
        <Text style={[{marginBottom:'1%',color:'blue',fontSize:18}]}>All you need to do buy credit and start using any tool from library</Text>
        <Text style={{marginBottom:'1%',color:'blue',fontSize:18}}>Pricing vary from tool and LLM usage please use drop down to figure out price</Text>
        <Text style={{marginBottom:'1%',color:'blue',fontSize:18}}>Typically 1 rupee equals to 10 credits</Text>
        <View style={{justifyContent:'flex-end',alignContent:'center',margin:'20%',borderRadius: 10, height: 40}}>
        <TouchableOpacity onPress={handleRazorpayPayment} style={{ backgroundColor: '#0092ca', padding: 10, borderRadius: 10, height: 40 }}>
          <Text style={{ color: 'white', textAlign: 'center',fontWeight:'bold' }}>Buy Credits</Text>
        </TouchableOpacity>
            
      </View>
        
      </View>

      <View  style={{flex:1,flexDirection:'column',justifyContent:'center',alignContent:'flex-start'}}>
          <View style={[styles.LLMFlex,{alignItems:'center'}]}>
                <DropDownPicker
                  open={openLlm}
                  value={llmValue}
                  items={llmData}
                  setOpen={setOpenLlm}
                  dropDownStyle={{backgroundColor: '#fafafa'}}
                  containerStyle={[styles.LLM,{width:'40%'}]}
                  onChangeItem={(item) =>{
                      console.log('AKASH');
                      console.log(item);
                    }                 
                  }
                  placeholder={'Choose an llm.'}
                />  
            </View>
            <View style={[styles.LLMFlex,{alignItems:'center'}]}>
                <DropDownPicker
                  open={openTools}
                  value={toolValue}
                  items={activeOptions.map(option => ({ label: option.title, value: option.id }))}
                  defaultValue={selectedOption}
                  setOpen={setOpenTools}
                  dropDownStyle={{backgroundColor: '#fafafa'}}
                  containerStyle={[styles.LLM,{width:'40%'}]}
                  onChangeItem={item => {setSelectedOption(item.value);
                    setToolValue(item.value);}}
                  placeholder={'Choose Tool'}
                />  
            </View>
      </View>
    </View>
  );
};

export default Payment;
