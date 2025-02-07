import { Component, EventEmitter, HostListener, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { ActionAskGPT } from 'src/app/models/action-model';
import { Intent } from 'src/app/models/intent-model';
import { variableList } from '../../../../../utils';
import { MatDialog } from '@angular/material/dialog';
import { IntentService } from '../../../../../services/intent.service';
import { KnowledgeBaseService } from 'src/app/services/knowledge-base.service';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';
import { AppConfigService } from 'src/app/services/app-config';

@Component({
  selector: 'cds-action-askgpt',
  templateUrl: './cds-action-askgpt.component.html',
  styleUrls: ['./cds-action-askgpt.component.scss']
})
export class CdsActionAskgptComponent implements OnInit {

  @Input() intentSelected: Intent;
  @Input() action: ActionAskGPT;
  @Input() previewMode: boolean = true;
  @Input() project_id: string;
  @Output() updateAndSaveAction = new EventEmitter;
  @Output() onConnectorChange = new EventEmitter<{type: 'create' | 'delete',  fromId: string, toId: string}>()
  
  listOfIntents: Array<{name: string, value: string, icon?:string}>;

  // Connectors
  idIntentSelected: string;
  idConnectorTrue: string;
  idConnectorFalse: string;
  isConnectedTrue: boolean = false;
  isConnectedFalse: boolean = false;
  connector: any;

  kbs_list = [];
  kb_selected_id: string = null;
  status_code: number;
  indexing_hint: string = null;


  // gptkey: string = "";
  buttonDisabled: boolean = false;
  buttonIcon: string = "add"
  buttonText: string = "Add Knowledge Base";

  idBot: string;
  variableListUserDefined: Array<{ name: string, value: string }> // = variableList.userDefined 
  spinner: boolean = false;

  private logger: LoggerService = LoggerInstance.getInstance();
  
  constructor(
    // private openaikbService: OpenaiService,
    private kbService: KnowledgeBaseService,
    public dialog: MatDialog,
    private intentService: IntentService,
    private appConfigService: AppConfigService,
  ) { }

  ngOnInit(): void {
    this.logger.debug("[ACTION-ASKGPT] action detail: ", this.action);
    console.log("[ACTION-ASKGPT] action detail: ", this.action);
    console.log("[ACTION-ASKGPT] action kbid: ", this.action.kbid);
    console.log("[ACTION-ASKGPT] action kbname: ", this.action.kbName);

    this.intentService.isChangedConnector$.subscribe((connector: any) => {
      this.logger.debug('[ACTION-ASKGPT] isChangedConnector -->', connector);
      this.connector = connector;
      this.updateConnector();
    });

    if (this.previewMode == false) {
      this.onDetailModeLoad();
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    if(this.intentSelected){
      this.initializeConnector();
    }

    // if (this.previewMode == false) {
    //   this.onDetailModeLoad();
    // }
  }

  onDetailModeLoad() {
    this.getKnowledgeBaseSettings();
    this.initializeAttributes();
  }


  initializeConnector() {
    this.idIntentSelected = this.intentSelected.intent_id;
    this.idConnectorTrue = this.idIntentSelected+'/'+this.action._tdActionId + '/true';
    this.idConnectorFalse = this.idIntentSelected+'/'+this.action._tdActionId + '/false';
    this.listOfIntents = this.intentService.getListOfIntents()
  }

  private updateConnector(){
    try {
      const array = this.connector.fromId.split("/");
      const idAction= array[1];
      if(idAction === this.action._tdActionId){
        if(this.connector.deleted){ //TODO: verificare quale dei due connettori è stato eliminato e impostare isConnected a false
          // DELETE 
          if(array[array.length -1] === 'true'){
            this.action.trueIntent = null
            this.isConnectedTrue = false
          }        
          if(array[array.length -1] === 'false'){
            this.action.falseIntent = null
            this.isConnectedFalse = false;
          }
          this.updateAndSaveAction.emit();
        } else { 
          // TODO: verificare quale dei due connettori è stato aggiunto (controllare il valore della action corrispondente al true/false intent)
          // ADD / EDIT
          this.logger.debug('[ACTION-ASKGPT] updateConnector', this.connector.toId, this.connector.fromId ,this.action, array[array.length-1]);
          if(array[array.length -1] === 'true'){
            // this.action.trueIntent = '#'+this.connector.toId;
            this.isConnectedTrue = true;
            if(this.action.trueIntent !== '#'+this.connector.toId){ 
              this.action.trueIntent = '#'+this.connector.toId;
              this.updateAndSaveAction.emit();
            } 
          }        
          if(array[array.length -1] === 'false'){
            // this.action.falseIntent = '#'+this.connector.toId;
            this.isConnectedFalse = true;
            if(this.action.falseIntent !== '#'+this.connector.toId){ 
              this.action.falseIntent = '#'+this.connector.toId;
              this.updateAndSaveAction.emit();
            } 
          }
        }
        // this.updateAndSaveAction.emit();
      }
    } catch (error) {
      this.logger.error('[ACTION-ASKGPT] updateConnector error: ', error);
    }
  }

  getKnowledgeBaseSettings() {
    console.log("**** carico solo dopo aver aperto il dettaglio")
    this.kbService.getKbSettings().subscribe((kbSettings: any) => {
      this.logger.debug("[ACTION-ASKGPT] get kbSettings: ", kbSettings);
      this.kbs_list = kbSettings.kbs.map(t => {
        t.icon = "language"
        return t;
      })
      if (this.action.kbid) {
        let kb_selected = kbSettings.kbs.find(k => k.url === this.action.kbid);
        if (!kb_selected) {
          this.action.kbid = null;
          this.action.kbName = null;
        } else {
          this.kb_selected_id = kb_selected._id;
        }
      }
    }, (error) => {
      this.logger.error("[ACTION-ASKGPT] ERROR get kbSettings: ", error);
    }, () => {
      this.logger.info("[ACTION-ASKGPT] get kbSettings *COMPLETE*");
    })
  }

  private initializeAttributes() {
    let new_attributes = [];
    if (!variableList.userDefined.some(v => v.name === 'kb_reply')) {
      new_attributes.push({ name: "kb_reply", value: "kb_reply" });
    }
    if (!variableList.userDefined.some(v => v.name === 'kb_source')) {
      new_attributes.push({ name: "kb_source", value: "kb_source" });
    }
    variableList.userDefined = [ ...variableList.userDefined, ...new_attributes];
    this.logger.debug("[ACTION ASKGPT] Initialized variableList.userDefined: ", variableList.userDefined);
  }

  changeTextarea($event: string, property: string) {
    this.logger.log("[ACTION-ASKGPT] onEditableDivTextChange event", $event)
    this.logger.log("[ACTION-ASKGPT] onEditableDivTextChange property", property)
    this.action[property] = $event
    this.updateAndSaveAction.emit();
  }

  onSelectedAttribute(event, property) {
    this.logger.log("[ACTION-ASKGPT] onEditableDivTextChange event", event)
    this.logger.log("[ACTION-ASKGPT] onEditableDivTextChange property", property)
    this.action[property] = event.value;
    this.updateAndSaveAction.emit();
  }

  onChangeSelect(event) {
    if (event.clickEvent === 'footer') {
      // this.openAddKbDialog();  moved in knowledge base settings
    } else {
      console.log("event: ", event);
      this.action.kbid = event.url;
      this.action.kbName = event.name;
      let kb_selected = this.kbs_list.find(k => k.url === this.action.kbid);
      if (kb_selected) {
        this.kb_selected_id = kb_selected._id;
      }
      //this.checkKbStatus(this.action.kbid);
      this.logger.log("[ACTION-ASKGPT] updated action", this.action);
      this.updateAndSaveAction.emit();
    }
  }

  onChangeBlockSelect(event:{name: string, value: string}, type: 'trueIntent' | 'falseIntent') {
    if(event){
      this.action[type]=event.value
    }

    switch(type){
      case 'trueIntent':
        this.onConnectorChange.emit({ type: 'create', fromId: this.idConnectorTrue, toId: this.action.trueIntent})
        break;
      case 'falseIntent':
        this.onConnectorChange.emit({ type: 'create', fromId: this.idConnectorFalse, toId: this.action.falseIntent})
        break;
    }
    this.updateAndSaveAction.emit();
  }

  onResetBlockSelect(event:{name: string, value: string}, type: 'trueIntent' | 'falseIntent') {
    switch(type){
      case 'trueIntent':
        this.onConnectorChange.emit({ type: 'delete', fromId: this.idConnectorTrue, toId: this.action.trueIntent})
        break;
      case 'falseIntent':
        this.onConnectorChange.emit({ type: 'delete', fromId: this.idConnectorFalse, toId: this.action.falseIntent})
        break;
    }
    this.action[type]=null
    this.updateAndSaveAction.emit();
  }
  
  onChangeAttributes(attributes:any, type:'trueIntent' | 'falseIntent'){
    this.logger.log("type: ", type)
    this.logger.log("attributes: ", attributes)
    if (type === 'trueIntent') {
      this.action.trueIntentAttributes = attributes;
    }
    if (type === 'falseIntent') {
      this.action.falseIntentAttributes = attributes;
    }
    this.logger.log("action updated: ", this.action)
  }

  // getValue(key: string): string{
  //   let value = ''
  //   if(this.kbs_list && this.kbs_list.length > 0)
  //     value = this.kbs_list.find(el => el.url === this.action.kbid)
  //     value? value = value[key]: value= ''
  //   return value   
  // }

  goToKNB(){
    let url = this.appConfigService.getConfig().dashboardBaseUrl + 'dashboard/#/project/' + this.project_id +'/knowledge-bases'
    window.open(url, '_blank')
  }

  @HostListener('document:visibilitychange')
  visibilitychange() {
    if (!document.hidden && this.previewMode == false) {
      this.getKnowledgeBaseSettings();
    }
  }


  // -----------------
  // TO CHECK / DELETE
  // -----------------


  // getAllOpenaiKbs() {
  //   this.openaikbService.getAllOpenaikbs().subscribe((kbs: any[]) => {
  //     this.kbs_list = kbs.map(t => {
  //       t.icon = "language"
  //       return t;
  //     })
  //     if (this.action.kbid) {
  //       this.kb_selected_id = this.kbs_list.find(k => k.url === this.action.kbid)._id;
  //       this.kb_selected_name = this.kbs_list.find(k => k.url === this.action.kbid).name;
  //       //this.checkKbStatus(this.action.kbid);
  //     }
  //     //this.checkLimit();
  //   }, (error) => {
  //     this.logger.error("[ACTION ASKGPT] ERROR get openai kbs: ", error);
  //   }, () => {
  //     this.logger.info("[ACTION ASKGPT] get openai kbs *COMPLETED*");
  //   })
  // }

  // openAddKbDialog() {
  //   const dialogRef = this.dialog.open(AddkbDialogComponent, {
  //     panelClass: 'custom-dialog-container',
  //     data: { name: '', url: '' }
  //   });
  //   dialogRef.afterClosed().subscribe(result => {
  //     this.logger.info("[ACTION ASKGPT] Dialog result - new openai kb: ", result);
  //     if (result && result.name && result.url) {
  //       this.saveOpenaiKb(result);
  //     }
  //   });
  // }

  // saveOpenaiKb(new_kb) {
  //   this.openaikbService.addOpenaiKb(new_kb).subscribe((savedKb) => {
  //     this.getAllOpenaiKbs();
  //   }, (error) => {
  //     this.logger.error("[ACTION ASKGPT] ERROR add new kb: ", error);
  //   }, () => {
  //     this.logger.info("[ACTION ASKGPT] add new kb *COMPLETED*");
  //   })
  // }

  // onDeleteSelect(id) {
  //   this.openDeleteDialog(id);
  // }

  // openDeleteDialog(id) {
  //   const dialogRef = this.dialog.open(DialogYesNoComponent, {
  //     panelClass: 'custom-dialog-container',
  //     data: { title: 'Delete Knowledge base', text: 'Are you sure you want to delete permanently this Knwoledge base?', yes: 'Delete', no: 'Cancel' }
  //   })
  //   dialogRef.afterClosed().subscribe(result => {
  //     if (result && result !== undefined && result !== false) {
  //       this.deleteKb(id);
  //     }
  //   })
  // }

  // deleteKb(id: string) {
  //   if (this.kb_selected_id === id) {
  //     this.action.kbid = null;
  //     this.kb_selected_id = null;
  //     this.status_code = null;
  //   }
  //   this.openaikbService.deleteOpenaiKb(id).subscribe((deletedKb) => {
  //     this.logger.info("deletedKb response ", deletedKb);
  //     this.logger.log("deletedKb response ", deletedKb);
  //     this.getAllOpenaiKbs();
  //   }, (error) => {
  //     this.logger.error("[ACTION ASKGPT] ERROR delete kb: ", error);
  //   }, () => {
  //     this.logger.info("[ACTION ASKGPT] delete kb *COMPLETE*");
  //   })
  // }

  // checkKbStatus(kbid) {
  //   let data = {
  //     full_url: kbid 
  //   }
  //   this.gptService.checkScrapingStatus(data).subscribe((status: any) => {
  //     this.spinner = false;
  //     this.logger.log("[ACTION ASKGPT] Scraping status: ", status);
  //     this.status_code = status.status_code;;
  //   }, (error) => {
  //     this.logger.error("[ACTION ASKGPT] error getting scraping status: ", error);
  //   }, () => {
  //     this.logger.log("[ACTION ASKGPT] get scraping status *COMPLETE*")
  //   })
  // }

  // startKbIndexing() {

  //   this.spinner = true;
  //   if (!this.action.gptkey) {
  //     this.indexing_hint = "Missing GPT Key"
  //     this.spinner = false;
  //   } else {
  //     let data = {
  //       full_url: this.action.kbid,
  //       gptkey: this.action.gptkey
  //     }

  //     this.gptService.startScraping(data).subscribe((response: any) => {
  //       if (response.message === 'Invalid Openai API key') {
  //         this.indexing_hint = response.message;
  //       }
  //       this.checkKbStatus(this.action.kbid);
  //     }, (error) => {
  //       this.logger.error("[ACTION ASKGPT] error start indexing: ", error);
  //       this.indexing_hint = error.message;
  //       this.spinner = false;
  //     }, () => {
  //       this.logger.log("[ACTION ASKGPT] start indexing *COMPLETE*");
  //     })
  //   }
  // }

  // checkLimit() {
  //   if (this.kbs_list.length >= 3) {
  //     this.buttonDisabled = true;
  //     this.buttonIcon = null;
  //     this.buttonText = "Maximum number of Knwoledge Bases reached"
  //   } else {
  //     this.buttonDisabled = false;
  //     this.buttonIcon = "add";
  //     this.buttonText = "Add Knowledge Bases"
  //   }
  // }

}
