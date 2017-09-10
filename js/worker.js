"use strict";

/*
                                                                                
  C_    - constant                                                              
  G_    - global variable                                                       
  _     - selector (string node) variable                                       
  $     - selector (element node / element nodelist) variable                   
  @     - function definition                                                   
  @-<   - procedure definition                                                  
  @->   - procedure call                                                        
  [number of @ = depth of nesting, @ = global, @@ = 2nd level, etc ...]         
  o-<   - superObject definition                                                
  o->   - superObject initialization                                            
  EVENT - DOM action-reaction                                                   
                                                                                
*/

self.addEventListener("message", function(e)
{                       
  /* Parameters */                     
  var characters = e.data.characters;
  var setSize = e.data.setSize;
                                                
  /* Helpers */
  var charactersCount = characters.length;
  var combinations = [];   
  var combinationsCount = Math.pow(charactersCount, setSize);  
  var target;
  var result; 
  var ii;
                                 
  for(var i = 1; i <= (combinationsCount * setSize); i++)
  {                                  
    ii = (i % setSize);
    if(ii === 0){ii = setSize;}                
                            
    target = Math.ceil(i / (combinationsCount / Math.pow(charactersCount, ii))) % charactersCount;                                              
    if(target === 0){ target = charactersCount; }
  
    combinations.push(characters[target - 1]);                                              
  }                
          
  result = combinations.slice();
  
  for(var i = 0; i < result.length; i++)                                    
  {                                                                               
    if(i % setSize === (setSize - 1) && i !== (result.length - 1)){ result[i] = result[i] + ","; }      
    if(i % setSize === 0){ result[i] = "#" + result[i]; }                
  }        
                         
  result = result.join("").split(",");      
                                      
  postMessage(result);
});

/*
                                                                                
  Copyright (c) 2016 Patrik Horvát                                              
                                                                                
*/ 