/// <reference path='../ui/controls/formbase.ts'/>
/// <reference path='../scripts/authoring.ts'/>
/// <reference path='../scripts/typings/jquery/jquery.d.ts'/>

module CZ {
    export module UI {
        export interface IFormEditTimelineInfo extends CZ.UI.IFormUpdateEntityInfo {
            startDate: string;
            endDate: string;
            deleteButton: string;
            titleInput: string;
			tagInput: string;
            errorMessage: string;
            context: Object;
        }

        export class FormEditTimeline extends CZ.UI.FormUpdateEntity {
            public saveButton: JQuery;
            private deleteButton: JQuery;
            private startDate: CZ.UI.DatePicker;
            private endDate: CZ.UI.DatePicker;
            private titleInput: JQuery;
            private errorMessage: JQuery;
			private tagInput: JQuery;

            private timeline: any;
            private isCancel: boolean;

            // We only need to add additional initialization in constructor.
            constructor(container: JQuery, formInfo: IFormEditTimelineInfo) {
                super(container, formInfo);

                this.saveButton = container.find(formInfo.saveButton);
                this.deleteButton = container.find(formInfo.deleteButton);
                this.startDate = new CZ.UI.DatePicker(container.find(formInfo.startDate));
                this.endDate = new CZ.UI.DatePicker(container.find(formInfo.endDate));
                this.titleInput = container.find(formInfo.titleInput);
                this.errorMessage = container.find(formInfo.errorMessage);
				this.tagInput = container.find(formInfo.tagInput);

                this.timeline = formInfo.context;

                this.saveButton.off();
                this.deleteButton.off();

                this.titleInput.focus(() => {
                    this.titleInput.hideError();
                });

                this.initialize();
            }

            private initialize(): void 
			{
				var subject = "cztimeline:" + this.timeline.guid;
                var predicate = "czpred:" + "virtualtimeline";
                
				this.saveButton.prop('disabled', false);
                if (CZ.Authoring.mode === "createTimeline") {
                    this.deleteButton.hide();
					this.tagInput.hide();
                    this.titleTextblock.text("Create Timeline");
                    this.saveButton.text("create timeline");
                }
                else if (CZ.Authoring.mode === "editTimeline") {
                    this.deleteButton.show();
                    this.titleTextblock.text("Edit Timeline");

					var triples = CZ.Service.getTriplets(subject, predicate, null);
					var tagText = this.ParseTriples(triples);
					this.tagInput.val(tagText);

                    this.saveButton.text("update timeline");
                }
                else if (CZ.Authoring.mode === "createRootTimeline") {
                    this.deleteButton.hide();
                    this.closeButton.hide();
					this.tagInput.hide();
                    this.titleTextblock.text("Create Root Timeline");
                    this.saveButton.text("create timeline");
                }
                else {
                    console.log("Unexpected authoring mode in timeline form.");
                    this.close();
                }

                this.isCancel = true;
                this.endDate.addEditMode_Infinite();
				
				this.titleInput.val(this.timeline.title);
                this.startDate.setDate(this.timeline.x, true);

                if (this.timeline.endDate === 9999) {
                    this.endDate.setDate(this.timeline.endDate, true);
                }
                else {
                    this.endDate.setDate(this.timeline.x + this.timeline.width, true);
                }
                this.saveButton.click(event => {
                    this.errorMessage.empty();
                    var isDataValid = false;
                    isDataValid = CZ.Authoring.validateTimelineData(this.startDate.getDate(), this.endDate.getDate(), this.titleInput.val());
                    // Other cases are covered by datepicker
                    if (!CZ.Authoring.isNotEmpty(this.titleInput.val())) {
                        this.titleInput.showError("Title can't be empty");
                    }

                    if (!CZ.Authoring.isIntervalPositive(this.startDate.getDate(), this.endDate.getDate())) {
                        this.errorMessage.text('Time interval should no less than one day');
                    }      
                    
                    if (!isDataValid) {
                        return;
                    }
                    else {
                        this.errorMessage.empty();
                        var self = this;
                        this.saveButton.prop('disabled', true);
                        CZ.Authoring.updateTimeline(this.timeline, {
                            title: this.titleInput.val(),
							start: this.startDate.getDate(),
                            end: this.endDate.getDate(),
                        }).then(
                            function (success) {
                                self.isCancel = false;
                                self.close();
                                
                                //Move to new created timeline
                                self.timeline.onmouseclick();
                            },
                            function (error) {
                                if (error !== undefined && error !== null) {
                                    self.errorMessage.text(error).show().delay(7000).fadeOut();
                                }
                                else {
                                    self.errorMessage.text("Sorry, internal server error :(").show().delay(7000).fadeOut();
                                }
                                console.log(error);
                            }
                        ).always(() => {
                            this.saveButton.prop('disabled', false);
                        });	
						if(this.timeline.guid){
							this.DeleteTriples(subject,predicate);
							if(this.tagInput.val()){
								 this.CreateTriples(subject, predicate, this.tagInput.val());
							}
						}
			
                    }
                });

                this.deleteButton.click(event => {
                    if (confirm("Are you sure want to delete timeline and all of its nested timelines and exhibits? Delete can't be undone!")) {
                        var isDataValid = true;
						//remove any triples associated with the virtual timeline.
						this.DeleteTriples(subject,predicate);
                        CZ.Authoring.removeTimeline(this.timeline);
                        this.close();
                    }
                });
            }			

            public show(): void {
                super.show({
                    effect: "slide",
                    direction: "left",
                    duration: 500
                });

                this.activationSource.addClass("active");
            }
			public DeleteTriples(subject,predicate):void{
				if (subject && predicate) {
                    var object = "czhashtag:" + "sample";
                    CZ.Service.deleteTriplet(subject, predicate, object);
                }
			}

			public CreateTriples(subject,predicate,tagInput):void{
				if (subject && predicate && tagInput) {
                    var tags = tagInput.split(",");
                    // Call to create new triples on timeline.
                    for (var i = 0; i < tags.length; i++) {
                        if (tags[i]) {
                            var object = "czhashtag:" + tags[i];
                            CZ.Service.putTriplet(subject, predicate, object);
                        }
                    }

                }
			}

			public ParseTriples(triples):string{
				var tagString="";
				if(triples && triples.responseText){
					var test = triples.responseText;
					var responseObject = JSON.parse(test);
					if (responseObject  && responseObject.length > 0 && responseObject[0].Objects) {
                        var objects = responseObject[0].Objects;
                        var objectCount = objects.length;
						if (objectCount < 1) return tagString;
                        else if (objectCount == 1) {
                            tagString += objects[0].Object.split("czhashtag:")[1];
                            return tagString;
                        }
                        for (var i = 0; i < (objectCount - 1) ; i++) {
                            tagString += objects[i].Object.split("czhashtag:")[1] + ",";
                        }
                        tagString += objects[objectCount - 1].Object.split("czhashtag:")[1];
                    }
				}
				return tagString;
			}		

            public close() {
                this.errorMessage.empty();

                super.close({
                    effect: "slide",
                    direction: "left",
                    duration: 500,
                    complete: () => {
                        this.endDate.remove();
                        this.startDate.remove();
                        this.titleInput.hideError();
                    }
                });

                if (this.isCancel && CZ.Authoring.mode === "createTimeline") {
                    CZ.VCContent.removeChild(this.timeline.parent, this.timeline.id);
                    CZ.Common.vc.virtualCanvas("requestInvalidate");
                }

                CZ.Authoring.isActive = false;

                this.activationSource.removeClass("active");

                CZ.Common.vc.virtualCanvas("showNonRootVirtualSpace");
            }
        }
    }
}