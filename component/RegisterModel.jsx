




const RegisterModal = ({navigation}) => {
    

  return (
    // Main container with a gray background
    <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={handleModalClose}
>
        <View style={styles.centeredView}>
            <TouchableOpacity  style={{justifyContent:'center'}} onPress={() =>  handleModalClose()}>
                <MaterialIcons name="cancel" size={24} color="gray" />
            </TouchableOpacity>
    
            <View style={[styles.modalView,{backgroundColor:'#d3d3d3'}]}>
                <Image source={require('../assets/search-logo.png')} style={styles.Searchlogo} />
                <Text style={styles.modalText}>Enter your  credentials:</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={setEmail}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                />
                <View style={{flexDirection:'row', justifyContent: 'center'}}>
                    <View style={{width:'60%', height:'100%', margin:'10%'}}>
                    <Button title="Login" onPress={()=>{handleLogin()}} />
                    </View>

                    <View style={{width:'60%', height:'100%',borderRadius:'8', margin:'10%'}}>
                    <Button title="Register" onPress={()=>{showRegisterView()}} />
                    </View>

                </View>
                
                </View>
    


        </View>
</Modal>
  );
};

// Export the component
export default RegisterModal;