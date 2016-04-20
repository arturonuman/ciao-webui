var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * React Component - Catalogue
 * This component was created to be used specifically in the catalogs of CIAO
 *
 * the following fields must be sent in the props
 *
 *  + data Array of json with the information to show in the table
 *  + columns Array with the columns to show in the table
 *  + actions Array of json with the buttons to add to the toolbar
 *      the json has to have this fields:
 *      -label: string name displayed on the button
 *      -name: string identifier of the button (remove?)
 *      -onClick function to execute when the user clicked the button
 *      -onDisabled function that is the button should be disabled (true/false)
 *  + dropDownAction Array of json with the buttons to add to the dropdown
 *      the json has to have this fields:
 *      -
 *      -
 *      -
 *  + searchFields [] fields to search
 *
 */

var React = require('react');
var CustomTable = require('./customTable.js');
var TableActionToolbar = require('./tableActionToolbar.js');
var CustomAlert = require('./customAlert.js');
var CustomModal = require('./customModal.js');

var AlertMixin = {
    getInitialState: function () {
        return { _alert: false };
    },
    renderAlert: function () {
        if (this.state._alert) {
            return React.createElement(CustomAlert, this.state._alert);
        }
    },
    hideAlert: function () {
        this.setState({ _alert: false });
    },
    showAlert: function (options) {
        this.setState({ _alert: options });
    }
};

var ModalMixin = {
    getInitialState: function () {
        return { _modal: false };
    },
    renderModal: function () {
        if (this.state._modal) {
            return React.createElement(CustomModal, this.state._modal);
        }
    },
    onClose: function () {
        this.setState({ _modal: false });
    },
    onAccept: function (callback) {
        this.setState({ _modal: false });
        this.setState({ selectedInstance: [] });
        callback(this.state.selectedInstance);
    },
    showModal: function (options) {
        options.onClose = this.onClose;
        options.onAccept = this.onAccept.bind(null, options.onAccept);
        this.setState({ _modal: options });
    }
};

var catalogue = React.createClass({
    displayName: 'catalogue',

    mixins: [AlertMixin, ModalMixin],
    getInitialState: function () {
        return {
            selectedInstance: [],
            disabledButtons: []
        };
    },
    actualData: [],
    getDefaultProps: function () {
        return {
            paginationDefault: {
                itemsPerPage: 10
            }
        };
    },
    selectInstance: function (selected) {
        //merge con selectInstances

        this.hideAlert();
        this.setState({ selectedInstance: selected });
    },
    selectInstances: function (query, inAllItems) {

        var selectedInstance = [];
        var allInstances = [];
        var key = [];

        //var data = (inAllItems)?this.props.data:this.actualData;
        var data = inAllItems ? this.props.data : this.props.data;

        if (query) {
            key = Object.keys(query);
        }

        if (key.length > 0) {
            selectedInstance = data.filter(function (instance) {
                return instance[key] == query[key];
            });

            allInstances = this.props.data.filter(function (instance) {
                return instance[key] == query[key];
            });

            if (inAllItems === false) {

                this.showAlert({
                    selectedPage: {
                        selectInPage: selectedInstance.length,
                        selectInAllPages: allInstances.length,
                        action: query[key],
                        onClick: this.selectInstances.bind(null, query, true)
                    },
                    alertType: "alert frm-alert-information"
                });
            } else {
                this.showAlert({
                    selectedAll: {
                        selectInAllPages: allInstances.length,
                        onClick: this.unselectAllInstances
                    },
                    alertType: "alert frm-alert-information"
                });
            }
        } else {
            //select all
            selectedInstance = this.props.data;
            this.hideAlert();
        }
        this.setState({ selectedInstance: selectedInstance });
    },
    unselectAllInstances: function () {
        this.setState({ selectedInstance: [] });
        this.hideAlert();
    },
    addDefaultDropDownActions: function (items) {

        if (!items[0] || items[0].name != 'all') {
            items.unshift({
                label: 'All',
                name: 'all',
                onClick: this.selectInstances.bind(null, {}, true)
            });
        }

        if (items[items.length - 1].name != 'none') {
            items.push({
                label: 'None',
                name: 'none',
                onClick: this.unselectAllInstances
            });
        }

        return items;
    },
    getToolbarConfiguration: function () {

        var config = this.props;
        var dropDownActions = [];

        if (config.dropDownActions) {
            dropDownActions = config.dropDownActions;
            for (i = 0; i < dropDownActions.length; i++) {
                var query = dropDownActions[i]['query'];
                dropDownActions[i]['onClick'] = this.selectInstances.bind(null, query, false);
            }
        }
        dropDownActions = this.addDefaultDropDownActions(dropDownActions);

        return {
            buttonItems: config.actions ? config.actions : [],
            searchFields: config.searchFields ? config.searchFields : [],
            dropDownActions: dropDownActions
        };
    },
    getTableConfiguration: function () {

        var config = this.props;
        var pagination = {
            items: this.props.count,
            itemsPerPage: this.props.limit
        };
        // var pagination = config.pagination ?
        //     config.pagination : this.props.paginationDefault;

        return {
            columns: config.columns ? config.columns : [],
            data: config.data ? config.data : [],
            pagination: pagination,
            onSelectRow: this.selectInstance,
            selectedRows: this.state.selectedInstance,
            onChangePage: this.setActualItems,
            link: config.link ? config.link : false
        };
    },
    //here table component will set the actual items
    //TODO:  Better way?
    setActualItems: function (lastItem) {
        //this.actualData =  actualData;
        this.props.onChangePage(lastItem);
    },
    render: function () {

        var toolbarconfiguration = this.getToolbarConfiguration();
        var tableconfiguration = this.getTableConfiguration();

        return React.createElement(
            'div',
            null,
            React.createElement(TableActionToolbar, _extends({
                selectedInstance: this.state.selectedInstance
            }, toolbarconfiguration)),
            React.createElement(
                'div',
                { className: 'row' },
                React.createElement(
                    'div',
                    { className: 'col-xs-12' },
                    this.renderAlert()
                )
            ),
            React.createElement(CustomTable, tableconfiguration),
            this.renderModal()
        );
    }
});

module.exports = catalogue;
