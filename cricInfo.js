
// node .\cricInfo.js --finfold=WorldCup2019 --dest=WorldCup.json --exceldest=worldcupexcel.xlsx --url=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

//Activity to make excel and pdf of ICC world cup 2019
//npm init -y
//npm install minimist
//npm install axios
//npm install jsdom
// npm install excel4node
// npm install pdf-lib

let minimist= require("minimist");

let axios= require("axios");
let jsdom= require("jsdom");
let excel= require("excel4node");
let pdf= require("pdf-lib");
let path= require("path");
let fs= require("fs");

let args= minimist(process.argv);

console.log(args.url);
// console.log(args.finfold);
// console.log(args.dest);
// console.log(args.exceldest);

let datafromurl= axios.get(args.url);

datafromurl.then(function(response){
    
    //console.log(completedata);
    //writefileindownloaded form
    let html= response.data;
    //console.log(html);
    let dom= new jsdom.JSDOM(html);

    let document= dom.window.document;
    //console.log(document.title);
    let matchDiv= document.querySelectorAll('[class="ds-px-4 ds-py-3"]');//hamne pehle har block ko leliya
    console.log(matchDiv.length);
    let  matches=[];
    for(let i=0;i<matchDiv.length;i++){
        let teamname= matchDiv[i].querySelectorAll('[class="ds-text-tight-m ds-font-bold ds-capitalize"]');
        let score= matchDiv[i].querySelectorAll('[class="ds-text-compact-s ds-text-typo-title"] strong');
        // console.log(score.length);
        let result= matchDiv[i].querySelectorAll('[class="ds-text-tight-s ds-font-regular ds-truncate ds-text-typo-title"]');
        // // console.log(result[0].textContent);
        let match={            
        };
        match.t1=teamname[0].textContent;
        match.t2=teamname[1].textContent;
        
        
        if(score.length==0){
            match.t1s=" ";
            match.t2s=" ";            
        }
        else if(score.length==1){
            match.t1s=score[0].textContent;
            match.t2s=" ";            
        }
        else if(score.length==2){
            match.t1s=score[0].textContent;
            match.t2s=score[1].textContent;         
        }
        match.result= result[0].textContent;       
        matches.push(match);
    }
    
    // let json = JSON.stringify(matches);
    // fs.writeFileSync("jsonfile.json",json,"utf-8");
    // matches= JSON.parse(json);
  
    // console.log(matches.length);

    

    let Inscorecard=[];
    for(let i=0;i<matches.length;i++){
        createarrayformatch(Inscorecard,matches[i].t1);
        createarrayformatch(Inscorecard,matches[i].t2);
    }
    // console.log(Inscorecard);
    // let json = JSON.stringify(Inscorecard);
    // fs.writeFileSync("Inscorecard.json",json,"utf-8");

    for(let i=0;i<Inscorecard.length;i++){
        putvsteaminInscorecard(Inscorecard[i].match,Inscorecard[i].name,matches);        
    }    
    let json = JSON.stringify(Inscorecard);
    fs.writeFileSync("Inscorecard.json",json,"utf-8");
   
    // createExcel(args.exceldest,Inscorecard);
    
    createfolderandpdf(args.finfold,Inscorecard);
    
});

function createfolderandpdf(folder,team){

    if(fs.existsSync(folder)==true){
        fs.rmdirSync(folder,{recursive:true});
    }
    
    fs.mkdirSync(folder);
// console.log("hello");
    for(let i=0;i<team.length;i++){
        let teamfolder= path.join(folder,team[i].name);       
        
            fs.mkdirSync(teamfolder);

            for(let j=0;j<team[i].match.length;j++){                
                creatematchpdf(teamfolder,team[i].match[j],team[i].name);
            }  
    }
}

function creatematchpdf(teamfolder,match,hometeam){

    let vsname= path.join(teamfolder,match.vs);
    let templatekabytes= fs.readFileSync("Template.pdf");
    let pdfdockapromise= pdf.PDFDocument.load(templatekabytes);

    pdfdockapromise.then(function(pdfdoc){
        let page= pdfdoc.getPage(0);
        page.drawText(hometeam,{
            x:330,
            y:697,
            size: 18
        });

        page.drawText(match.vs,{
            x:330,
            y:657,
            size:18
        });

        page.drawText(match.t1s,{
            x:330,
            y:625,
            size: 18
        });

        page.drawText(match.t2s,{
            x:330,
            y:590,
            size:18
        });

        page.drawText(match.result,{
            x:330,
            y:557,
            size:18
        });

        let changedbyte= pdfdoc.save();
        changedbyte.then(function(finalpdf){

            if(fs.existsSync(vsname+".pdf")==true){
                fs.writeFileSync(vsname+"1.pdf",finalpdf);
            }else{
                fs.writeFileSync(vsname+".pdf",finalpdf);
            }            
        });
    });
}

function createExcel(excelfile,team){

    let wb= new excel.Workbook();

    for(let i=0;i<team.length;i++){

        let sheet =wb.addWorksheet(team[i].name);
        
        sheet.cell(1,1).string("VS");
        sheet.cell(1,2).string("Team 1 score");
        sheet.cell(1,3).string("Team 2 score");
        sheet.cell(1,4).string("RESULT");
        
        for(let j=0;j<team[i].match.length;j++){

            sheet.cell(2+j,1).string(team[i].match[j].vs);
            sheet.cell(2+j,2).string(team[i].match[j].t1s);
            sheet.cell(2+j,3).string(team[i].match[j].t2s);
            sheet.cell(2+j,4).string(team[i].match[j].result);
        }
    }
    wb.write(excelfile);
}


function putvsteaminInscorecard(toputvs,t1,matches){

    for(let i=0;i<matches.length;i++){

        if(matches[i].t1==t1){
            toputvs.push({
                vs: matches[i].t2,
                t1s: matches[i].t1s,
                t2s:matches[i].t2s,
                result:matches[i].result
            });
        }
    }
}


function createarrayformatch(Inscorecard,teamname){

    let idx= -1;
    for(let i=0;i<Inscorecard.length;i++){
        if(Inscorecard[i].name == teamname){
            idx=1;
            break;
        }
    }
    if(idx==-1){
        Inscorecard.push({
            name:teamname,
            match:[]
        });  
    }
}


