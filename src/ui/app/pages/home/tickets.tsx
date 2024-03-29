// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import LoadingIndicator from '../../components/loading/LoadingIndicator';
import isValidTicket from '../../helpers/isValidTicket';
import { api } from '../../redux/store/thunk-extras';
import { useAppSelector } from '_hooks';
import { accountTicketsSelector } from '_redux/slices/account';
import TicketList from '_src/ui/app/shared/content/rows-and-lists/TicketList';
import TicketProjectList from '_src/ui/app/shared/content/rows-and-lists/TicketProjectList';
import TextPageTitle from '_src/ui/app/shared/headers/page-headers/TextPageTitle';

import type { SuiObjectData } from '@mysten/sui.js/client';

function TicketsPage() {
    const navigate = useNavigate();
    const params = useParams();
    const address = useAppSelector(({ account }) => account.address);
    const tickets = useAppSelector(accountTicketsSelector);
    const [validTickets, setValidTickets] = useState<
        SuiObjectData[] | undefined
    >();
    const myTickets = useMemo(() => params['*'] === 'my_tickets', [params]);

    useEffect(() => {
        if (!tickets) return;

        const checkTickets = async () => {
            const client = api.instance.client;
            const validTickets: SuiObjectData[] = [];
            for (const ticket of tickets) {
                if (
                    ticket.content &&
                    'type' in ticket &&
                    'fields' in ticket.content
                ) {
                    const isValid = await isValidTicket(
                        client,
                        ticket.content,
                        address || '',
                        ticket.content.fields &&
                            'ticket_agent_id' in ticket.content.fields &&
                            typeof ticket.content.fields.ticket_agent_id ===
                                'string'
                            ? ticket.content?.fields.ticket_agent_id
                            : ''
                    );

                    if (isValid) {
                        validTickets.push(ticket);
                    }
                }
            }

            setValidTickets(validTickets);
        };

        checkTickets();
    }, [tickets, address]);

    const showTicketSection = useCallback(() => {
        navigate('/my_tickets');
    }, [navigate]);

    const showProjectSection = useCallback(() => {
        navigate('/tickets');
    }, [navigate]);

    return (
        <div>
            <div className="py-6 flex justify-evenly">
                <TextPageTitle
                    title="Discover"
                    onClick={showProjectSection}
                    padding={false}
                    selected={!myTickets}
                />
                <TextPageTitle
                    title="My Tickets"
                    count={validTickets?.length}
                    onClick={showTicketSection}
                    padding={false}
                    selected={myTickets}
                />
            </div>
            {myTickets ? (
                validTickets ? (
                    <TicketList tickets={validTickets} />
                ) : (
                    <LoadingIndicator />
                )
            ) : (
                <TicketProjectList />
            )}
        </div>
    );
}

export default TicketsPage;
