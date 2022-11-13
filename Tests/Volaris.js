const {By,Key,Builder, until} = require("selenium-webdriver");
const readXlsxFile = require('read-excel-file/node');
const writeXlsxFile = require('write-excel-file/node');
require("chromedriver");
var passengers = 2;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function bookFlyTest(){
    let driver = await new Builder().forBrowser("chrome").build();
    await driver.manage().window().maximize();
    await driver.get("https://www.volaris.com/");
    //await driver.manage().setTimeouts({ implicit: 15 });
    await getLocation("departure", driver);
    var from = await setLocation("departure", driver);
    await getLocation("arrival", driver);
    var to = await setLocation("arrival", driver);
    var idaNo = await setDate("departure",driver);
    await setDate("arrival",driver,idaNo);
    await setPassengers(passengers, driver);
    await getElement("xpath","(//button[@color='primary'])[1]",driver).then((el)=>(el.click()));
    await validationFlight(from, to, driver);
    await driver.quit();
}
bookFlyTest()
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function validationFlight(fromExpected, toExpected, driver){
    var fromActual = await getElement("xpath","//span[normalize-space()='"+fromExpected+"']",driver).then((el)=>(el.getText())); fromActual += '';
    var toActual = await getElement("xpath","//span[@role='presentation'][normalize-space()='"+toExpected+"']",driver).then((el)=>(el.getText())); toActual += ''; 
    if(fromActual === fromExpected && toActual === toExpected){
        console.log("///////////////////////////////////////////////////////////////////////");
        console.log("Congrats!! Youre flight is booked");
        console.log("///////////////////////////////////////////////////////////////////////");
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function setPassengers(passengers, driver){
    await getElement("xpath","//mat-form-field[@aria-label='Passengers']",driver).then((el)=>(el.click()));
    let index = 1;
    while (index < passengers) {
        await getElement("xpath","(//button[@type='button'])[4]",driver).then((el)=>(el.click()));
        index++;
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getLocation(flyT, driver){
    switch (flyT) {
        case "departure":
            await getElement("css",".btnSearch.radius-6",driver).then((el)=>(el.click()));
            let array1 = await getElement("xpaths","//h5[contains(text(),'from')]/parent::div/following-sibling::div//li/div[1]",driver);
            var mappedAirportsD = await Promise.all(array1.map(async (airportD) => await airportD.getText()));
            if(mappedAirportsD[1] == 'undefined'){
                getLocation("departure", driver);
            }
            else{
                await writeExcel(array1);
            }
        break;
        case "arrival":
            let array2 = await getElement("xpaths","//h5[contains(text(),'to')]/parent::div/following-sibling::div//li/div[1]",driver);
            var mappedAirportsA = await Promise.all(array2.map(async (airportA) => await airportA.getText()));
            if(mappedAirportsA[1] == 'undefined'){
                getLocation("arrival", driver);
            }
            else{
                await writeExcel(array2);
            }
        break;
    }   
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function setLocation(flyT, driver){ 
    return await readXlsxFile("C:/Users/2000079317/Documents/JavaScriptSelenium/Tests/Write1.xlsx").then((rows) => {
        var index1 = Math.floor(Math.random() * rows.length);
        switch (flyT) {
            case "departure":
                from = rows[index1]; from += '';
                getElement("id","fnameOrigin",driver).then((el)=>(el.sendKeys(from)));
                getElement("xpath","//div[contains(text(),'"+from+"')]/parent::li",driver).then((el)=>(el.click()));
                return from;
            case "arrival":
                to = rows[index1]; to += '';
                getElement("id","fnameDestination",driver).then((el)=>(el.sendKeys(to)));
                getElement("xpath","//div[contains(text(),'"+to+"')]/parent::li",driver).then((el)=>(el.click()));
                return to;
        }
    })
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function setDate(dateT,driver,idaNo){
    switch (dateT) {
        case "departure": 
            await driver.sleep(8000);
            let days = await getElement("xpaths","//div[@class='calendar left ng-star-inserted']//tbody/tr/td",driver); var indexDays2 = 0;
            var mappedDays = await Promise.all(days.map(async (calendarAvailable) => await calendarAvailable.getAttribute("class")));
            for (let indexDays = 0; indexDays < 30; indexDays++) {
                mappedDays[indexDays] += '';
                if (mappedDays[indexDays].includes("available") == true){
                    indexDays2++; 
                }
            }
            if (indexDays2 == 0){
                console.log("NO FLIGHTS AVAILABLE!!!!!!!!!"); console.log("REPEATING TEST!!!!!!!!!!!!!!!");
                await driver.quit(); await driver.sleep(1500);
                await bookFlyTest();
            }
            else{
                let dias = await getElement("xpaths","//tbody[@class='drp-animate']//td//span[2]",driver); var Prices = [];
                var mappedCalendar = await Promise.all(dias.map(async (calendar) => await calendar.getText()));
                for (let index = 0; index < mappedCalendar.length; index++) {
                    mappedCalendar[index] += '';
                    Prices.push(mappedCalendar[index].split("$")[1]);
                }
                const cheaper = Math.min(...Prices); 
                await getElement("xpath","(//td/span[contains(text(),'"+cheaper+"')]/parent::td)[1]",driver).then((el)=>(el.click()));
                var ida = await getElement("xpath","(//td/span[contains(text(),'"+cheaper+"')]/parent::td)[1]/span[1]",driver).then((el)=>(el.getText()));
                var idaNo = parseInt(ida);
                return idaNo;
            }
        case "arrival":
            await driver.sleep(1500);
            var diavuelta = idaNo + 10; 
            if(diavuelta > 30){
                var diavuelta1 = diavuelta - 30;
                var element1 = await getElement("xpath","(//div[@class='calendar right ng-star-inserted']//table[@class='table-condensed ng-star-inserted']//tbody//span[text()='"+diavuelta1+"'])[1]/parent::td",driver);
                var att = await element1.getAttribute("class");
                while (att.includes("disabled") == true ){
                    var element1 = await getElement("xpath","(//div[@class='calendar right ng-star-inserted']//table[@class='table-condensed ng-star-inserted']//tbody//span[text()='"+diavuelta1+"'])[1]/parent::td",driver);
                    var att = await element1.getAttribute("class");
                    diavuelta1++;
                }
                await element1.click();
            }
            else{
                var element2 = await getElement("xpath","((//table[@class='table-condensed ng-star-inserted']//tbody)[1]//span[text()='"+diavuelta+"'])[1]/parent::td",driver);
                var att2 = await element2.getAttribute("class");
                while (att2.includes("disabled") == true ){
                    var element2 = await getElement("xpath","((//table[@class='table-condensed ng-star-inserted']//tbody)[1]//span[text()='"+diavuelta+"'])[1]/parent::td",driver);
                    var att2 = await element2.getAttribute("class");
                    diavuelta++;
                }
                await element2.click();
            }
            await getElement("xpath","(//span[@class='mat-button-wrapper'][normalize-space()='Done'])[2]",driver).then((el)=>(el.click()));
    }
  
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function writeExcel(arrayT){
    var mappedAirports = await Promise.all(arrayT.map(async (airport) => await airport.getText()));
    var i = 0; var variables = arrayT.length; let data_row = []; let data_info = [];
    for (var p = 0; p < variables; p++) {
        data_row[p] = p;
    }
    while(i < variables){
      data_row[p] = [
        {
            type : String,
            value : mappedAirports[i]
        }
      ]
      data_info.push(data_row[p])
      i++;
    }
    await writeXlsxFile(data_info, {
      filePath: 'C:/Users/2000079317/Documents/JavaScriptSelenium/Tests/Write1.xlsx'
    })
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getElement(locatorT, locator, driver){
    switch(locatorT){
        case "id":
            return await driver.wait(until.elementLocated(By.id(locator)),25000);
        break;
        case "xpath":
            return await driver.wait(until.elementLocated(By.xpath(locator)),25000);
        break;
        case "css":
            return await driver.wait(until.elementLocated(By.css(locator)),25000);
        break;
        case "name":
            return await driver.wait(until.elementLocated(By.name(locator)),25000);
        break;
        case "class":
            return await driver.wait(until.elementLocated(By.className(locator)),25000);
        break;
        case "xpaths":
            return await driver.wait(until.elementsLocated(By.xpath(locator)),25000);
        break;
        case "csss":
            return await driver.wait(until.elementsLocated(By.css(locator)),25000);
        break;
    }
}