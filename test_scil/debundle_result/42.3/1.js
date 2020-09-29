const t = exports;
const e = module;
'use strict';
var Tree = function () {
  function Tree(e, t, n) {
  }
  Tree.prototype.getItemById = function (e) {
    return e === d.e && (e = this.getRootProjectId()), this.idToItemMap.get(e);
  };
  Tree.prototype.beginPushAndPoll = function () {
    return this.pushPollInProgress.setValue(true), this.mostRecentOperationTransactionIdWhenPushPollInitiated.setValue(this.mostRecentOperationTransactionId.getValue()), this.pendingOperationQueue.copyTo(this.inFlightOperationQueue), this.pendingOperationQueue.clear(), this.pendingExpandedProjectsDelta.copyTo(this.inFlightExpandedProjectsDelta), this.pendingExpandedProjectsDelta.clear(), this.getPushPollData();
  };
  Tree.prototype.resetPushAndPollAfterSave = function () {
    this.resetPushAndPoll(true), this.lastPushPollCompleteTimestamp.setValue(Date.now());
  };
  Tree.prototype.applyLocalEdit = function (item, new_content_string, description, metadata1, metadata2) {
    var i = {
      projectid: itemTool.s(item),
      metadataPatches: metadata1,
      metadataInversePatches: metadata2
    };
    null !== new_content_string && (i.name = new_content_string), null !== description && (i.description = description), this.applyLocalOperationAndAddToPendingQueue('edit', i);
  };
  return Tree;
}();