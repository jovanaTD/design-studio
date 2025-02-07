import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ACTIONS_LIST, INTENT_ELEMENT } from '../../../../../utils';
import { Action } from 'src/app/models/action-model';
import { LoggerService } from 'src/chat21-core/providers/abstract/logger.service';
import { LoggerInstance } from 'src/chat21-core/providers/logger/loggerInstance';

@Component({
  selector: 'cds-action-description',
  templateUrl: './cds-action-description.component.html',
  styleUrls: ['./cds-action-description.component.scss']
})
export class CdsActionDescriptionComponent implements OnInit {

  @Input() actionSelected: Action;
  @Input() elementType: string;
  @Input() previewMode: boolean = true
  @Input() showTip: boolean = false;
  // @Output() closeIntent = new EventEmitter();
  // @Output() saveIntent = new EventEmitter();
  
  titlePlaceholder: string = 'Set a title';
  element: any;
  dataInput: string;

  private logger: LoggerService = LoggerInstance.getInstance();
  constructor() { }

  ngOnInit(): void {    
  }

  ngOnChanges(){
    this.logger.log('ActionDescriptionComponent ngOnChanges:: ', this.actionSelected, this.elementType);
    if(this.actionSelected){
      this.elementType = this.actionSelected._tdActionType;
    }
    try {

      switch(this.elementType){
        case 'form':
        case 'question':
        case 'answer':
          this.element = Object.values(INTENT_ELEMENT).find(el => el.type === this.elementType)
          break;
        default:
          this.element = Object.values(ACTIONS_LIST).find(el => el.type === this.elementType)
          break;
      }
      // this.element = ELEMENTS_LIST.find(item => item.type === this.elementType);
      
      if(this.actionSelected._tdActionTitle && this.actionSelected._tdActionTitle != ""){
        this.dataInput = this.actionSelected._tdActionTitle;
      }
      this.logger.log('ActionDescriptionComponent action:: ', this.element);
    } catch (error) {
      this.logger.log("error ", error);
    }
  }

  // onCloseIntent(){
  //   this.closeIntent.emit();
  // }

  // onSaveIntent(){
  //   this.saveIntent.emit();
  // }

  onChangeText(text: string){
    this.logger.log('ActionDescriptionComponent onChangeText:: ', text);
    this.actionSelected._tdActionTitle = text;
  }

}
