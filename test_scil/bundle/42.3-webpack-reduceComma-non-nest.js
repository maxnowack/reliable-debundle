// debundle.config=debundle.config-reduceComma.json
!(function main(e) {
    var t = {};

    function n(r) {
        if (t[r])
            return t[r].exports;
        var o = t[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return e[r].call(o.exports, o, o.exports, n),
            o.l = !0,
            o.exports
    }

    n.m = e,
        n.c = t,
        n.d = function (e, t, r) {
            n.o(e, t) || Object.defineProperty(e, t, {
                enumerable: !0,
                get: r
            })
        }
        ,
        n.r = function (e) {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
                value: "Module"
            }),
                Object.defineProperty(e, "__esModule", {
                    value: !0
                })
        }
        ,
        n.t = function (e, t) {
            if (1 & t && (e = n(e)),
            8 & t)
                return e;
            if (4 & t && "object" == typeof e && e && e.__esModule)
                return e;
            var r = Object.create(null);
            if (n.r(r),
                Object.defineProperty(r, "default", {
                    enumerable: !0,
                    value: e
                }),
            2 & t && "string" != typeof e)
                for (var o in e)
                    n.d(r, o, function (t) {
                        return e[t]
                    }
                        .bind(null, o));
            return r
        }
        ,
        n.n = function (e) {
            var t = e && e.__esModule ? function () {
                    return e.default
                }
                : function () {
                    return e
                }
            ;
            return n.d(t, "a", t),
                t
        }
        ,
        n.o = function (e, t) {
            return Object.prototype.hasOwnProperty.call(e, t)
        }
        ,
        n.p = "/media/js/",
        n(n.s = 799)
})([

    function (e, t, n) {
        "use strict";
        /// n(0)
        e.exports = n(1)
    }
    , function (e, t, n) {
        "use strict";
        /// n(432)
        var Tree = function () {
            function Tree(e, t, n) {

            }

            return Tree.prototype.getItemById = function (e) {
                    return e === d.e && (e = this.getRootProjectId()),
                        this.idToItemMap.get(e)
                }
                ,
                Tree.prototype.beginPushAndPoll = function () {
                    return this.pushPollInProgress.setValue(!0),
                        this.mostRecentOperationTransactionIdWhenPushPollInitiated.setValue(this.mostRecentOperationTransactionId.getValue()),
                        this.pendingOperationQueue.copyTo(this.inFlightOperationQueue),
                        this.pendingOperationQueue.clear(),
                        this.pendingExpandedProjectsDelta.copyTo(this.inFlightExpandedProjectsDelta),
                        this.pendingExpandedProjectsDelta.clear(),
                        this.getPushPollData()
                }
                ,
                Tree.prototype.resetPushAndPollAfterSave = function () {
                    this.resetPushAndPoll(!0),
                        this.lastPushPollCompleteTimestamp.setValue(Date.now())
                }
                ,
                Tree.prototype.applyLocalEdit = function (item, new_content_string, description, metadata1, metadata2) {
                    var i = {
                        projectid: itemTool.s(item),
                        metadataPatches: metadata1,
                        metadataInversePatches: metadata2
                    };
                    null !== new_content_string && (i.name = new_content_string),
                    null !== description && (i.description = description),
                        this.applyLocalOperationAndAddToPendingQueue("edit", i)
                }
                ,
                Tree
        }();

    }
]);
