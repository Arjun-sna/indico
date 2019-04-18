/* This file is part of Indico.
 * Copyright (C) 2002 - 2019 European Organization for Nuclear Research (CERN).
 *
 * Indico is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 3 of the
 * License, or (at your option) any later version.
 *
 * Indico is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Indico; if not, see <http://www.gnu.org/licenses/>.
 */

import _ from 'lodash';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import PropTypes from 'prop-types';
import {Modal, Icon, Dimmer, Loader, Popup} from 'semantic-ui-react';

import {serializeDate} from 'indico/utils/date';
import {actions as bookRoomActions, selectors as bookRoomSelectors} from '../../modules/bookRoom';
import TimelineLegend from './TimelineLegend';
import DailyTimelineContent from './DailyTimelineContent';

import './SingleRoomTimelineModal.module.scss';


const _getRowSerializer = (day, room) => {
    return ({bookings, preBookings, candidates, conflictingCandidates, nonbookablePeriods, unbookableHours,
             blockings, conflicts, preConflicts}) => ({
        availability: {
            candidates: (candidates[day] || []).map((candidate) => ({...candidate, bookable: false})) || [],
            conflictingCandidates: (conflictingCandidates[day] || []).map((candidate) => (
                {...candidate, bookable: false}
            )) || [],
            preBookings: preBookings[day] || [],
            bookings: bookings[day] || [],
            conflicts: conflicts[day] || [],
            preConflicts: preConflicts[day] || [],
            nonbookablePeriods: nonbookablePeriods[day] || [],
            unbookableHours: unbookableHours || [],
            blockings: blockings[day] || []
        },
        label: serializeDate(day, 'L'),
        key: day,
        room
    });
};

const _SingleRoomTimelineContent = props => {
    const {availability, availabilityLoading, room, filters, roomAvailability, actions: {fetchAvailability}} = props;
    useEffect(() => {
        if (_.isEmpty(roomAvailability)) {
            fetchAvailability(room, filters);
        }
    }, [fetchAvailability, filters, room, roomAvailability]);

    const isLoaded = !_.isEmpty(availability) && !availabilityLoading;
    if (!isLoaded) {
        return <Dimmer active page styleName="dimmer"><Loader /></Dimmer>;
    }

    const renderRoomTimeline = () => {
        const {dateRange} = availability;
        const rows = dateRange.map((day) => _getRowSerializer(day, room)(availability));
        return <DailyTimelineContent rows={rows} fixedHeight={rows.length > 1 ? '70vh' : null} />;
    };

    return renderRoomTimeline();
};

_SingleRoomTimelineContent.propTypes = {
    room: PropTypes.object.isRequired,
    availability: PropTypes.object,
    availabilityLoading: PropTypes.bool.isRequired,
    filters: PropTypes.object.isRequired,
    roomAvailability: PropTypes.object,
    actions: PropTypes.exact({
        fetchAvailability: PropTypes.func.isRequired,
    }).isRequired,
};

_SingleRoomTimelineContent.defaultProps = {
    availability: {},
    roomAvailability: {},
};

const SingleRoomTimelineContent = connect(
    state => ({
        filters: bookRoomSelectors.getFilters(state),
        availability: bookRoomSelectors.getBookingFormAvailability(state),
        availabilityLoading: bookRoomSelectors.isFetchingFormTimeline(state),
    }),
    (dispatch) => ({
        actions: bindActionCreators({
            fetchAvailability: bookRoomActions.fetchBookingAvailability,
        }, dispatch)
    }),
)(React.memo(_SingleRoomTimelineContent));


/**
 * Timeline modal for a single room
 *
 * @param {Boolean} props.open - Whether the modal should be visible.
 * @param {String} props.title - Modal title.
 * @param {Function} props.onClose - Function to execute when closing the modal.
 * @param {Object} props.roomAvailability - Room availability if it was previously
 * fetched, otherwise it'll be fetched here.
 * @param {Object} props.room - Room whose timeline will be displayed.
 * @param {Array} props.legendLabels- Array containing timeline legend labels.
 */
const SingleRoomTimelineModal = props => {
    const {open, title, onClose, roomAvailability, room, legendLabels} = props;
    return (
        <Modal open={open}
               onClose={onClose}
               size="large" closeIcon>
            <Modal.Header className="legend-header">
                {title || room.name}
                <Popup trigger={<Icon name="info circle" className="legend-info-icon" />}
                       content={<TimelineLegend labels={legendLabels} compact />} />
            </Modal.Header>
            <Modal.Content>
                <SingleRoomTimelineContent room={room} roomAvailability={roomAvailability} />
            </Modal.Content>
        </Modal>
    );
};

SingleRoomTimelineModal.propTypes = {
    open: PropTypes.bool,
    title: PropTypes.node,
    onClose: PropTypes.func,
    roomAvailability: PropTypes.object,
    room: PropTypes.object.isRequired,
    legendLabels: PropTypes.array,
};

SingleRoomTimelineModal.defaultProps = {
    open: false,
    title: '',
    onClose: () => {},
    roomAvailability: {},
    legendLabels: [],
};

export default SingleRoomTimelineModal;