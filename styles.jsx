import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d3d3d3',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchBar: {
    height: 40,
    width: 700,
    borderColor: 'gray',
    borderWidth: 2,
    borderRadius: 5,
  },
  businessLink: {
    fontSize: 16,
    color: 'blue',
  },
  rowContainer: {
    flex: 1,
  },
  rowItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    flexDirection: 'row',
  },
  rowItem1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  searchBarFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  searchButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    
    height: 40,
    width: 200,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'blue',
    fontSize: 16,
  },
  LoginInput: {
    
    height: 40,
    width: 350,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  LoginButton: {
    
    height: 40,
    width: 350,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  TextFlex: {
    
    height: 40,
    width: 350,
    borderColor: 'gray',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'gray',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    height: 100,
    width: 150,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  AddUrlFlex: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'gray',
    flexDirection:'row'
  },
  AddUrlTextBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection:'column'
  }
  ,
  AddUrlButton: {
    flex: 1,
    height: 40,
    width: 10,
    flexDirection:'column',
    borderWidth: 2,
    borderTopRightRadius:5,
    borderBottomRightRadius:5,
    borderColor: 'gray',
    backgroundColor:'blue'
  },
  AddUrl: {
    height: 40,
    width: 800,
    borderColor: 'gray',
    borderWidth: 2,
    borderTopLeftRadius:5,
    borderBottomLeftRadius:5,
  },
  AddUrlbuttonText: {
    color: 'white',
    fontSize: 16,
    alignContent:'center',
    alignItems:'center',
    paddingLeft:50,
    paddingTop:7
  }
});

export default styles;
