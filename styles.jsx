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
    flex: .4,
    height: 40,
    width: 100,
    flexDirection:'column',
    borderWidth: 2,
    borderTopRightRadius:5,
    borderBottomRightRadius:5,
    borderColor: 'gray',
    backgroundColor:'blue'
  },
  AddUrl: {
    height: 40,
    width: 1000,
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
  },
  AddUrlList: {
    flex:1,
    borderColor: 'gray',
    borderWidth: 2,
    borderRadius:5,
    flexDirection:'row'
  },
  AddUrlRow: {
    flex:1,
    borderColor: 'gray',
  
    flexDirection:'row'
  },
  errorText: {
    flex:1,
    borderColor: 'red',
    fontSize:10
  },
  errorViewFlex: {
    flex:.1,
    color: 'red',
    fontSize:10,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'gray',
    flexDirection:'row'
  },
  AddUrlText: {
    height: 40,
    width: 1000,
    borderColor: 'gray',
    color:'black',
    borderWidth: 2,
    borderTopLeftRadius:5,
    borderBottomLeftRadius:5,
  },
  SeoContentFlex: {
    flex:1,
    borderColor: 'gray',
    paddingTop:10,    
    flexDirection:'row'
  },
  Title: {
    flex:1,
    borderColor: 'gray',
    borderWidth: 2,
    borderTopLeftRadius:5,
    borderBottomLeftRadius:5,
  },
  TitleInputBox: {
    margin:20,

    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding:10


  },
  TitleBodyBox: {
    margin:20,
    height: 400,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    padding:10


  },
  ContentButtonFlex: {
    flex:1,
    marginLeft:400,
    alignContent:"center",
    borderColor: 'gray',
    flexDirection:'row'
  },
  ContentButton: {
    flex: .2,
    height: 40,
    width: 20,
    margin:20,
    borderWidth: 1,
    borderRadius:5,
    alignContent:"center",
    borderColor: 'gray',
    backgroundColor:'blue'
  },
  ContentButtonText: {
    margin:5,
    color: 'white',
    fontSize: 16,
    alignContent:'center',
    alignItems:'center',
    alignSelf: "center",
  },
  keyWordButton:{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'lightgray',
      margin:5,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1
  },
  keyWordButtonFlex:{
    flex:1,
    margin:10,
    alignContent:"center",
    borderColor: 'gray',
    flexDirection:'row'
  },  tagCloudContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  crossText: {
    color: '#ffffff',
    fontSize: 18,
  },
  tagContainer: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 16,
  },
  competitorContainer: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 5,
    backgroundColor: 'blue'
  }
});

export default styles;
