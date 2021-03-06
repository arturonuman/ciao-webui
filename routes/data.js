var express = require('express');
var router = express.Router();
var sessionHandler = require('../core/session');
var ciaoAdapter = require('../core/ciao_adapter');
var querystring = require('querystring');
var TokenManager = new require('../core/tokenManager');
var NodeService = require('../core/nodeService');
var TenantService = require('../core/tenantService');

// Set up
var adapter = new ciaoAdapter();
var tokenManager = new TokenManager(sessionHandler);
var nodeService = new NodeService(adapter, tokenManager);
var tenantService = new TenantService(adapter, tokenManager);

// Validate session as an authorized token is required
router.use(sessionHandler.validateSession);

router.delete('/:tenant/servers/:server', function (req, res, next) {
    tokenManager.onSuccess(
        (t) => {
            var uri = "/v2.1/" + req.params.tenant +
                "/servers/" + req.params.server;
            var data = adapter.delete(uri,req.session.token, () => {
                res.send(data.raw);
            });
        })
        .validate(req, res);
});

// Tenant service POST Methods
router.post('/:tenant/servers', tenantService.createServers());
router.post('/:tenant/servers/action', tenantService.postServersAction());
router.post('/:tenant/servers/:server/action',
            tenantService.postServerAction());

router.get('/:tenant/servers/detail/count', tenantService.serversDetailCount());
router.get('/:tenant/servers/detail', tenantService.serversDetail());
router.get('/:tenant/servers/:server', tenantService.getServer());
router.get('/:tenant/flavors', tenantService.flavors());

// Ciao-webui only:
// This helper service optimize usage for current Grouped Instances
// implementation.
router.get('/:tenant/flavors/detail', tenantService.flavorsDetail());
router.get('/:tenant/flavors/:flavor', tenantService.getFlavor());

// TODO: this services only works for users with admin role.
// enable for common users
router.get('/flavors/:flavor/servers/detail', function(req, res, next) {
    var uri = "/v2.1/flavors/" +
        req.params.flavor + "/servers/detail";
    var data = adapter.get(
        uri,req.session.token,
        () => res.send(data.json));
});

router.get('/:tenant/resources', function(req, res, next) {
    tokenManager.onSuccess((t) => {
        var start = req.query.start;
        var end = req.query.end;
        var query = "?start="+start+"&end="+end;
        var uri = "/v2.1/" + req.params.tenant + "/resources" + query;
        var data = adapter.get(
            uri,req.session.token,
            () => res.send(data.json));
    })
        .onError(() => {
            res.send({});
        }
                )
        .validate(req, res);
});

router.get('/:tenant/quotas', function (req, res, next) {
    tokenManager.onSuccess((t) => {
        // validate Units for usage sumary components
        var getUnitString = function (value) {
            if (value == null)
                return function (arg) {return arg;};
            return value < 1500 ?
                value + "GB" :
                (value / 1000) + "TB";
        };
        var uri = "/v2.1/" + req.params.tenant + "/quotas";
        var data = adapter.get(uri,req.session.token, () => {
            if (data.json) {
                var validateQuota = (value) => {
                    if (value !== -1){
                        return value;
                    } else {
                        return null;
                    }
                };
                var usageSummaryData = [
                    {
                        value: data.json.instances_usage,
                        quota: validateQuota(data.json.instances_limit),
                        name: "Instances",
                        unit: ""
                    },
                    {
                        value: data.json.ram_usage,
                        quota: validateQuota(data.json.ram_limit),
                        name: "Memory",
                        unit: ""
                    },
                    {
                        value: data.json.cpus_usage,
                        name: "Processors",
                        quota: validateQuota(data.json.cpus_limit),
                        unit: ""
                    },
                    {
                        value: data.json.disk_usage,
                        quota: validateQuota(data.json.disk_limit),
                        name: "Disk",
                        unit: ""
                    }
                ];
                res.send(usageSummaryData);
            } else {
                res.send({usageSummaryData:{}});
            }
        });
    })
        .onError(() => {
            res.send({usageSummaryData:{}});
        })
        .validate(req, res);
});

// Handle node resources
router.get('/nodes', nodeService.nodes());
router.get('/nodes/count', nodeService.nodesCount());
router.get('/nodes/summary', nodeService.nodesSummary());
router.get('/nodes/:node', nodeService.getNode());
router.get('/nodes/:node/servers/detail', nodeService.serversDetail());
router.get('/nodes/:node/servers/detail/count',
           nodeService.serversDetailCount());

router.get('/cncis', function (req, res, next) {
    var uri = "/v2.1/cncis";
    var data = adapter.get(uri,req.session.token, () => {
        res.set('Content-Type','application/json');
        res.send(data.json);
    });
});

router.get('/cncis/:cnci/detail', function (req, res, next) {
    var uri = "/v2.1/cncis/" + req.params.cnci + "/detail";
    var data = adapter.get(uri,req.session.token, () => res.send(data.json));
});

module.exports = router;
