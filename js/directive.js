"use strict";

/* @-<imageGenerator **********************************************************/
/******************************************************************************/
function imageGenerator(settings = {})
{     
  /* Settings */
  var C_gridSize = settings["gridSize"] || 100;
  var C_itemRatio = settings["itemRatio"] || 1.5;
  var C_maxColumns = settings["maxColumns"] || 40;
  var C_minColumns = settings["minColumns"] || 2;
  var C_maxItemWidth = settings["maxItemWidth"] || 200;
  var C_minItemWidth = settings["minItemWidth"] || 100;    
  
  /* Selectors */           
  var _cancel = "cancel";
  var _dataContent = "data-content";              
  var _disabled = "disabled";
  var _displayed = "displayed";
  var _error = "error";
  var $imageGenerator = document.getElementById("image-generator");
  var $output = document.getElementById("image-generator-output");
  var $height = $imageGenerator.getElementsByClassName("height")[0];
  var $width = $imageGenerator.getElementsByClassName("width")[0];
  var $count = $imageGenerator.getElementsByClassName("count")[0];
  var $format = $imageGenerator.getElementsByClassName("format")[0];
  var $fill = $imageGenerator.getElementsByClassName("fill")[0];
  var $loading = $imageGenerator.getElementsByClassName("loading")[0];    
  var $generate = $imageGenerator.getElementsByClassName("generate")[0];
  var $download = $imageGenerator.getElementsByClassName("download")[0];
  var $status = $imageGenerator.getElementsByClassName("status")[0];
  var $link = $output.getElementsByClassName("link");
  var $progress;                                                    
  
  /* Helpers */
  var canvas;
  var webSmartColors;
  var count;
  var ctx;
  var fail;
  var fill;
  var fillStr;
  var format;
  var height;
  var heightStr;
  var html;
  var img;
  var interval;     
  var myGradient;
  var session = 0;
  var targetFill;
  var targetHeight;
  var targetWidth;
  var worker = new Worker("js/worker.js");
  var width;
  var widthStr;

  /* Query the worker to generate an array of websmart colors */
  worker.postMessage({characters : [0,1,2,3,4,5,6,7,8,9,"A","B","C","D","E","F"], setSize : 3});
  
  /* Update $status */
  $status.innerHTML = "<span class='datetime'>" + datetime(new Date()) + "</span><br>"
                    + "Waiting for the worker<br>"
                    + "to generate websmart colors ..."
                    + $status.innerHTML;
  
  /* EVENT - message - worker *************************************************/
  /****************************************************************************/
  worker.addEventListener("message", function(e)
  {
    /* Load websmart colors from the worker */
    webSmartColors = e.data;
                  
    removeClass($loading, _displayed);
    removeClass($generate, _disabled);
    
    /* Update $status */
    $status.innerHTML = "<span class='datetime'>" + datetime(new Date()) + "</span><br>"
                      + "<b style='color: #90E;'>Image generator</b> is ready.<br><br>"
                      + $status.innerHTML;    
  });

  /* EVENT - click - $generate ************************************************/
  /****************************************************************************/  
  $generate.addEventListener("click", function(e)
  {       
    if(hasClass(this, _disabled) === true) /* Dont fire generator when the trigger is disabled */
    {
      return false;
    }
    
    if(hasClass(this, _cancel) === true) /* Cancel generator */
    {
      /* Update $status */
      $status.innerHTML = "<span class='datetime'>" + datetime(new Date()) + "</span><br>"
                        + "<span class='error'>Generator cancelled.</span><br><br>"
                        + $status.innerHTML;
                        
      /* Update $output */
      $output.innerHTML = html;
      
      if($output.children.length !== 0)
      {
        /* @->resizeGrid */ 
        resizeGrid({ $container : document.body, $content : $output, $item : $output.children }, { gridSize : C_gridSize, itemRatio : C_itemRatio, maxColumns : C_maxColumns, minColumns : C_minColumns, maxItemWidth : C_maxItemWidth, minItemWidth : C_minItemWidth }); 
      }
      
      removeClass(this, _cancel);  
      removeClass($loading, _displayed);
      removeClass($download, _disabled);
      
      /* @->contentSwitch*/
      contentSwitch($generate, _dataContent, $generate.innerHTML, $generate.getAttribute(_dataContent));
       
      clearInterval(interval);
      
      return false;
    }
  
    /* Initialize helpers */
    count = parseInt($count.value);
    fail = false;
    fill = $fill.value.replace(/\s+/g, "").split(",");
    fillStr = fill.join("");
    format = $format.value;
    height = $height.value.replace(/\s+/g, "").split(",");
    heightStr = height.join("");
    html = "";
    session++;
    width = $width.value.replace(/\s+/g, "").split(",");
    widthStr = width.join("");
    
    /* Validation (weak) */
    if(isNaN(count) === true || count === 0){ addClass($count, _error); fail = true; }else{ removeClass($count, _error); } // count
    if(isNaN(parseInt(heightStr)) === true){ addClass($height, _error); fail = true; }else{ removeClass($height, _error); } // height
    if(isNaN(parseInt(widthStr)) === true){ addClass($width, _error); fail = true; }else{ removeClass($width, _error); } // width
    if(fillStr.length < 4){ addClass($fill, _error); fail = true; }else{ removeClass($fill, _error); } // fill
    if(fail === true)
    {  
      $status.innerHTML = "<span class='datetime'>" + datetime(new Date()) + "</span><br>"
                        + "<span class='error'>Invalid input.</span><br><br>"
                        + $status.innerHTML;         
      return false;     
    }         
                                                                       
    /* Initialize helpers */
    fillStr = fillStr.length < 18 ? fillStr : fillStr.substring(0,18) + "...";                       
    heightStr = height.length === 1 ? height[0] : height[0] + " - " + height[1] + "px";
    widthStr = width.length === 1 ? width[0] : width[0] + " - " + width[1] + "px";                
    
    addClass($loading, _displayed);
    addClass($download, _disabled);
    
    /* Clear $output */
    $output.innerHTML = "";
     
    /* Update $status */    
    $status.innerHTML = "<span class='datetime'>" + datetime(new Date()) + "</span><br>"
                      + "Generating image/s<br>"
                      + "session  : " + session + "<br>"
                      + "count    : " + count + "<br>"
                      + "format   : " + format + "<br>"
                      + "height   : " + heightStr + "<br>"
                      + "width    : " + widthStr + "<br>"
                      + "color/s  : " + fillStr + "<br>"
                      + "progress : <span class='progress progress-" + session + "'>0/" + count + "</span><br><br>"
                      + $status.innerHTML;                       
               
    /* Wait for the DOM */
    setTimeout(function()
    {  
      /* Initialize selectors */   
      $progress = $imageGenerator.getElementsByClassName("progress-" + session)[0];      
                                
      addClass($generate, _cancel);
      
      /* @->contentSwitch*/
      contentSwitch($generate, _dataContent, $generate.innerHTML, $generate.getAttribute(_dataContent));  
                                            
      var i = 0;      
      interval = setInterval(function()
      {         
        /* Initialize helpers */                                                    
        targetFill = fill[0] === "random" ? "random" : fill; 
    		targetHeight = height.length === 1 ? parseInt(height[0]) : randomInt(parseInt(height[0]), parseInt(height[1]));	
    		targetWidth = width.length === 1 ? parseInt(width[0]) : randomInt(parseInt(width[0]), parseInt(width[1]));
        
        /* Create a canvas */		  		        
    		canvas = document.createElement("canvas");
    		canvas.height = targetHeight;						        
    		canvas.width = targetWidth;        		
    		ctx = canvas.getContext("2d");
        
        /* Fill the canvas */
        if(targetFill === "random") /* Random */                                      
        {
          myGradient = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
      		myGradient.addColorStop(0, webSmartColors[Math.floor(Math.random() * webSmartColors.length)]);
      		myGradient.addColorStop(1, webSmartColors[Math.floor(Math.random() * webSmartColors.length)]);
      		ctx.fillStyle = myGradient;
      		ctx.fillRect(0, 0, targetWidth, targetHeight);	
        }
        else /* An array of colors */
        {                                                 
          myGradient = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
          for(var ii = 0; ii < targetFill.length; ii++)
          {                                              
        		myGradient.addColorStop(ii / targetFill.length, targetFill[ii]);          
          }
      		ctx.fillStyle = myGradient;
      		ctx.fillRect(0, 0, targetWidth, targetHeight);	
        }			
    		
        /* Create a base64 image from the canvas */
        img = document.createElement("img");
    		img.src = canvas.toDataURL(format);

  		  html += "<div class='item'>"
              + "<a href='" + img.src + "' class='link' download='" + (i + 1) + "' title='Download image " + (i + 1) + ", height: " + targetHeight + "px, width: " + targetHeight + "px'><img src='" + img.src + "' alt='Image " + (i + 1) + "'></a>"
              + "<a href='" + img.src + "' class='info' download='" + (i + 1) + "' title='Download image " + (i + 1) + ", height: " + targetHeight + "px, width: " + targetWidth + "px'><b>" + targetHeight + "</b> x <b>" + targetWidth + "</b></a>"
              + "</div>"; 

        /* Update $progress */
        $progress.innerHTML = (i + 1) + " / " + count;       
      
        i++;
        
        /* Last iteration */
        if(i === count) 
        {
          clearInterval(interval);
          
          /* Update $status */
          $status.innerHTML = "<span class='datetime'>" + datetime(new Date()) + "</span><br>"
                            + "<span class='success'>Images generated</span><br><br>"
                            + $status.innerHTML;
          
          /* Update $output */
          $output.innerHTML = html;
         
          if($output.children.length !== 0)
          { 
            /* @->resizeGrid */ 
            resizeGrid({ $container : document.body, $content : $output, $item : $output.children }, { gridSize : C_gridSize, itemRatio : C_itemRatio, maxColumns : C_maxColumns, minColumns : C_minColumns, maxItemWidth : C_maxItemWidth, minItemWidth : C_minItemWidth });
          }
                   
          removeClass($generate, _cancel);
          removeClass($loading, _displayed);
          removeClass($download, _disabled);
          
          /* @->contentSwitch*/
          contentSwitch($generate, _dataContent, $generate.innerHTML, $generate.getAttribute(_dataContent));
        }
      }, 1);
    }, 10);      
  });
  
  /* EVENT - click - $download ************************************************/
  /****************************************************************************/
	$download.addEventListener("click", function()
	{                        
    if(hasClass(this, _disabled) === true) /* Dont fire download when the trigger is disabled */
    {
      return false;
    }  
   
    if(hasClass(this, _cancel) === true) /* Cancel the download */
    {
      removeClass(this, _cancel);
      
      /* @->contentSwitch*/
      contentSwitch($download, _dataContent, $download.innerHTML, $download.getAttribute(_dataContent));
      
      clearInterval(interval);
      
      return false;
    }  
        
    /* Initialize helpers */
    count = $link.length;
        
    addClass($download, _cancel);

    /* @->contentSwitch*/
    contentSwitch($download, _dataContent, $download.innerHTML, $download.getAttribute(_dataContent));        
                    
		var i = 0;
		interval = setInterval(function()
		{	          	 
			$link[i].click();	
			
      i++;
      
      /* Last iteration */
			if(i === count)
			{
				clearInterval(interval);
        
        removeClass($download, _cancel);
        
        /* @->contentSwitch*/
        contentSwitch($download, _dataContent, $download.innerHTML, $download.getAttribute(_dataContent));        
			}
		}, 500);
	});
  
  /* EVENT - resize - window **************************************************/
  /****************************************************************************/
  window.addEventListener("resize", function()
  {      
    if($output.children.length !== 0)
    {
      /* @->resizeGrid */ 
      resizeGrid({ $container : document.body, $content : $output, $item : $output.children }, { gridSize : C_gridSize, itemRatio : C_itemRatio, maxColumns : C_maxColumns, minColumns : C_minColumns, maxItemWidth : C_maxItemWidth, minItemWidth : C_minItemWidth });
    }
  });     
}

/* Library ********************************************************************/
/******************************************************************************/

/* @-<addClass ****************************************************************/
/******************************************************************************/
function addClass($element, targetClass)
{
  if(hasClass($element, targetClass) === false)
  {
    $element.className += " " + targetClass;
  }
}

/* @-<contentSwitch ***********************************************************/
/******************************************************************************/
function contentSwitch($element, _dataContent, currentContent, newContent)
{
  $element.innerHTML = newContent;
  $element.setAttribute(_dataContent, currentContent);  
}

/* @datetime ******************************************************************/
/******************************************************************************/
function datetime(datetime)
{
  return zeroPrefix(datetime.getDate()) + "." + (zeroPrefix(datetime.getMonth() + 1)) + "." + datetime.getFullYear() + " at " + zeroPrefix(datetime.getHours()) + ":" + zeroPrefix(datetime.getMinutes()) + ":" + zeroPrefix(datetime.getSeconds()) + "." + datetime.getMilliseconds();
}

/* @hasClass ******************************************************************/
/******************************************************************************/
function hasClass($element, targetClass)
{
  var rgx = new RegExp("(?:^|\\s)" + targetClass + "(?!\\S)", "g");
                                                                                         
  if($element.className.match(rgx))
  {
    return true;
  }
  else
  {
    return false;
  }
}     

/* @minMax ********************************************************************/
/******************************************************************************/
function minMax(value, min, max)
{
  if(value < min)
  {
    value = min;
  }
  else if(value > max)
  {
    value = max;  
  }
  
  return value;
}

/* @outerHeight ***************************************************************/
/******************************************************************************/
function outerHeight($element)
{                                      
  return parseInt($element.offsetHeight) + parseInt(getComputedStyle($element).marginBottom) + parseInt(getComputedStyle($element).marginTop);
}
    
/* @outerWidth ****************************************************************/
/******************************************************************************/
function outerWidth($element)
{
  return parseInt($element.offsetWidth) + parseInt(getComputedStyle($element).marginLeft) + parseInt(getComputedStyle($element).marginRight);
}

/* @randomInt *****************************************************************/
/******************************************************************************/
function randomInt(min, max)
{
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
}

/* @-<removeClass *************************************************************/
/******************************************************************************/
function removeClass($element, targetClass)
{                    
  var rgx = new RegExp("(?:^|\\s)" + targetClass + "(?!\\S)", "g");

  $element.className = $element.className.replace(rgx, "");
}

/* @-<resizeGrid **************************************************************/
/******************************************************************************/      																	                                                      
function resizeGrid(selectors, settings)   
{ 		                                      
  var _0x98a9=["\x24\x63\x6F\x6E\x74\x61\x69\x6E\x65\x72","\x24\x63\x6F\x6E\x74\x65\x6E\x74","\x24\x69\x74\x65\x6D","\x67\x72\x69\x64\x53\x69\x7A\x65","\x69\x74\x65\x6D\x52\x61\x74\x69\x6F","\x6D\x61\x78\x43\x6F\x6C\x75\x6D\x6E\x73","\x6D\x69\x6E\x43\x6F\x6C\x75\x6D\x6E\x73","\x6D\x61\x78\x49\x74\x65\x6D\x57\x69\x64\x74\x68","\x6D\x69\x6E\x49\x74\x65\x6D\x57\x69\x64\x74\x68","\x61\x64\x64\x69\x74\x69\x6F\x6E\x61\x6C\x49\x74\x65\x6D\x48\x65\x69\x67\x68\x74","\x61\x64\x64\x69\x74\x69\x6F\x6E\x61\x6C\x49\x74\x65\x6D\x57\x69\x64\x74\x68","\x77\x69\x64\x74\x68","\x63\x6C\x69\x65\x6E\x74\x57\x69\x64\x74\x68","\x66\x6C\x6F\x6F\x72","\x70\x75\x73\x68","\x6C\x65\x6E\x67\x74\x68","\x68\x65\x69\x67\x68\x74","\x73\x74\x79\x6C\x65","\x70\x78"];var $container=selectors[_0x98a9[0]],$content=selectors[_0x98a9[1]],$item=selectors[_0x98a9[2]],gridSize=settings[_0x98a9[3]],itemRatio=settings[_0x98a9[4]],maxColumns=settings[_0x98a9[5]],minColumns=settings[_0x98a9[6]],maxItemWidth=settings[_0x98a9[7]],minItemWidth=settings[_0x98a9[8]],additionalItemHeight=_0x98a9[9] in  settings?settings[_0x98a9[9]]:0,additionalItemWidth=_0x98a9[10] in  settings?settings[_0x98a9[10]]:0,contentWidth,possibleColumns=[],possibleItemWidth=[],targetColumns,targetItemWidth,testItemWidth,itemOutlineWidth=outerWidth($item[0])- parseInt(getComputedStyle($item[0])[_0x98a9[11]]);contentWidth= $content[_0x98a9[12]];for(var i=minColumns;maxColumns>= i;i++){testItemWidth= [Math[_0x98a9[13]](contentWidth/ i),i],testItemWidth[0]>= minItemWidth&& testItemWidth[0]<= maxItemWidth&& (possibleColumns[_0x98a9[14]](testItemWidth[1]),possibleItemWidth[_0x98a9[14]](testItemWidth[0]))};0=== possibleItemWidth[_0x98a9[15]]&& (possibleItemWidth[0]= maxItemWidth,possibleColumns[0]= Math[_0x98a9[13]](contentWidth/ possibleItemWidth[0])),targetItemWidth= possibleItemWidth[0],targetColumns= possibleColumns[0],contentWidth> gridSize* maxItemWidth&& (targetItemWidth= maxItemWidth,targetColumns= gridSize),targetItemWidth= Math[_0x98a9[13]](targetItemWidth- itemOutlineWidth);for(var i=0;i< $item[_0x98a9[15]];i++){$item[i][_0x98a9[17]][_0x98a9[16]]= Math[_0x98a9[13]](targetItemWidth/ itemRatio)+ additionalItemHeight+ _0x98a9[18],$item[i][_0x98a9[17]][_0x98a9[11]]= targetItemWidth+ additionalItemWidth+ _0x98a9[18]}
}

/* @zeroPrefix ****************************************************************/
/******************************************************************************/
function zeroPrefix(str)
{           
  str = str.toString();
               
  return str.length === 1 ? "0" + str : str;
}