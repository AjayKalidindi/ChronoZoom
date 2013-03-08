﻿// --------------------------------------------------------------------------------------------------------------------
// <copyright company="Outercurve Foundation">
//   Copyright (c) 2013, The Outercurve Foundation
// </copyright>
// --------------------------------------------------------------------------------------------------------------------

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.Serialization;

namespace Chronozoom.Entities
{
    [DataContract]
    public class Reference
    {
        [Key]
        [DataMember]
        public Guid ID { get; set; }

        [DataMember]
        public string Title { get; set; }

        [DataMember]
        public string Authors { get; set; }

        [DataMember]
        public string BookChapters { get; set; }

        [DataMember]
        public string CitationType { get; set; }
        
        [DataMember]
        public string PageNumbers { get; set; }

        [DataMember]
        public string Publication { get; set; }

        [DataMember]
        public string PublicationDates { get; set; }

        [DataMember]
        public string Source { get; set; }
    }

    [DataContract]
    [NotMapped]
    public class ReferenceRaw : Reference
    {
        public Guid Exhibit_ID { get; set; }
    }
}